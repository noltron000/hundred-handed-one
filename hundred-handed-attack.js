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
		value='1d4'
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

const rollCombiner = async (finalPromise, thisRoll) => {
	const finalMessage = await finalPromise
	const thisMessage = await thisRoll.toMessage({ }, {create: false})

	if (finalMessage == null) return thisMessage
	finalMessage.rolls.push(thisMessage.rolls.pop( ))
	return finalMessage
}

const callback = async (html) => {
	let attackRollType = html.find('input[name=\'input-radio\']')
	let numberOfAttacks = html.find('input[name=\'input-number-of-attacks\']')
	let damagePerAttack = html.find('input[name=\'input-damage-per-attack\']')
	let targetArmorClass = html.find('input[name=\'input-target-armor-class\']')

	attackRollType = attackRollType.val( ) // advantage / normal / disadvantage
	damagePerAttack = damagePerAttack.val( ) //  string
	numberOfAttacks = parseInt(numberOfAttacks.val( ))
	targetArmorClass = parseInt(targetArmorClass.val( ))

	let attackCoreDice
	if (attackRollType === 'advantage') attackCoreDice = '2d20dl1'
	else if (attackRollType === 'disadvantage') attackCoreDice = '2d20dh1'
	else attackCoreDice = '1d20'

	const attackRollModifiers = '3[dexterity] + 6[proficiency]'
	const attackRollText = `${attackCoreDice} + ${attackRollModifiers}`

	const allAttackRolls = (new Array(numberOfAttacks))
	.fill(null).map(( ) => new Roll(attackRollText))

	const attackRollMessage = await allAttackRolls.reduce(rollCombiner, null)
	attackRollMessage.flavor = 'A flowing, worm-like mass of arms approach you at a terrifying pace...'

	ChatMessage.create(attackRollMessage)

	/*
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

	await asyncTimeout(6000)
	await confirmDamage( )
	*/
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
