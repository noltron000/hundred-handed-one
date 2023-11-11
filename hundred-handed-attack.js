const asyncTimeout = async (ms) => {
	return await new Promise(resolve => setTimeout(resolve, ms));
}

// These are for inquiring about the number of attacks.
const content = `
<form>
	<fieldset>
		<legend>Roll Type</legend>

		<div>
			<input
				type='radio'
				id='input-radio-normal-roll'
				name='input-radio'
				value='normal'
				checked
			/>
			<label for='input-radio-normal-roll'>
				Normal Roll
			</label>
		</div>

		<div>
			<input
				type='radio'
				id='input-radio-advantage'
				name='input-radio'
				value='advantage'
			/>
			<label for='input-radio-advantage'>
				Advantage
			</label>
		</div>

		<div>
			<input
				type='radio'
				id='input-radio-disadvantage'
				name='input-radio'
				value='disadvantage'
			/>
			<label for='input-radio-disadvantage'>
				Disadvantage
			</label>
		</div>
	</fieldset>

	<label for='input-number-of-attacks'>
		Number of Attacks
	</label>
	<input
		type='number'
		name='input-number-of-attacks'
		id='input-number-of-attacks'
		value=25
	></input>

	<br />

	<label for='input-damage-per-attack'>
		Damage per Attack
	</label>
	<input
		type='text'
		name='input-damage-per-attack'
		id='input-damage-per-attack'
		value='1d4 + 3'
	></input>

	<br />

	<label for='input-target-armor-class'>
		Target Armor Class
	</label>
	<input
		type='number'
		name='input-target-armor-class'
		id='input-target-armor-class'
		value=10
	></input>

	<hr />
</form>
`

const callback = async (html) => {
	let attackRollType = html.find('input[name=\'input-radio\']')
	let numberOfAttacks = html.find('input[name=\'input-number-of-attacks\']')
	let damagePerAttack = html.find('input[name=\'input-damage-per-attack\']')
	let targetArmorClass = html.find('input[name=\'input-target-armor-class\']')

	numberOfAttacks = numberOfAttacks.val()
	attackRollType = attackRollType.val()
	damagePerAttack = damagePerAttack.val()
	targetArmorClass = targetArmorClass.val()

	console.log(attackRollType)

	const attackRollBonus = +3
	targetArmorClass -= attackRollBonus

	const attackRollText = `${numberOfAttacks}d20cs>=(${targetArmorClass} - ${attackRollBonus})`
	const attackRoll = new Roll(attackRollText)
	await attackRoll.roll()

	const confirmAttack = async ( ) => {
		ChatMessage.create({
			user: game.user._id,
			speaker: ChatMessage.getSpeaker(),
			content: 'A flowing, worm-like mass of arms approach you at a terrifying pace...'
		})

		await attackRoll.toMessage()
	}

	const attacksThatHit = parseInt(attackRoll.result)

	const damageRollText = new Array(attacksThatHit)
	.fill(damagePerAttack)
	.join(' + ')

	const damageRoll = new Roll(damageRollText)
	await damageRoll.roll()

	const confirmDamage = async ( ) => {
		ChatMessage.create({
			user: game.user._id,
			speaker: ChatMessage.getSpeaker(),
			content: `Of the ${numberOfAttacks} arms that lunge out at you, ${attacksThatHit} attacks hit!`
		})
		await damageRoll.toMessage()
	}

	await confirmAttack( )
	await asyncTimeout(6000)
	await confirmDamage( )
}

const buttonProps = {
	attack: {
		icon: "<i class='fas fa-swords'></i>",
		label: 'Confirm Attack',
		callback: callback,
	}
}

const title = 'Number of Attacks'
const buttonDefault = 'attack'

const dialog = new Dialog({
	title: title,
	content: content,
	buttons: buttonProps,
	default: buttonDefault,
})

/* INITIALIZE */
dialog.render(true)
