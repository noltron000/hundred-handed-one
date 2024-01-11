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
				id='normal-roll'
				name='input-radio'
				value='normal-roll'
				checked
			/>
			<label for='normal-roll'>
				Normal Roll
			</label>
		</div>

		<div>
			<input
				type='radio'
				id='advantage-roll'
				name='input-radio'
				value='advantage-roll'
			/>
			<label for='advantage-roll'>
				Advantage
			</label>
		</div>

		<div>
			<input
				type='radio'
				id='disadvantage-roll'
				name='input-radio'
				value='disadvantage-roll'
			/>
			<label for='disadvantage-roll'>
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

// This takes a roll promise and a roll, and returns a roll promise.
// It combines the final roll with the given roll and returns it.
const rollCombiner = async (finalPromise, thisRoll) => {
	// Obtain the two roll messages.
	const finalMessage = await finalPromise
	const thisMessage = await thisRoll.toMessage({ }, {create: false})

	// Determine the return value. Expect null as the base case.
	if (finalMessage == null) return thisMessage
	finalMessage.rolls.push(thisMessage.rolls.pop( ))
	return finalMessage
}

const callback = async (html) => {
	// STEP 1: DIALOGUE SETUP.
	// Let's gather up the information given from the DM.
	let attackRollType = html.find('input[name=\'input-radio\']:checked')
	let numberOfAttacks = html.find('input[name=\'input-number-of-attacks\']')
	let damageRollText = html.find('input[name=\'input-damage-per-attack\']')
	let targetArmorClass = html.find('input[name=\'input-target-armor-class\']')

	// Parse that info with jquery vals.
	attackRollType = attackRollType.val( ) // advantage / normal / disadvantage
	damageRollText = damageRollText.val( ) // string
	numberOfAttacks = parseInt(numberOfAttacks.val( ))
	targetArmorClass = parseInt(targetArmorClass.val( ))

	// Now determine roll type: advantage/disadvantage/normal
	let attackCoreDice
	if (attackRollType === 'advantage-roll') attackCoreDice = '2d20dl1'
	else if (attackRollType === 'disadvantage-roll') attackCoreDice = '2d20dh1'
	else attackCoreDice = '1d20'

	// Finish attack roll setup
	const attackRollModifier = +9 // +3 dex; +6 prof
	const attackRollText = `${attackCoreDice} + ${attackRollModifier}`

	// STEP 2: ATTACK EXECUTION.
	// Let's generate a series of dice rolls from the info given above.
	const allAttackRolls = (new Array(numberOfAttacks))
	.fill(null).map(( ) => new Roll(attackRollText))

	// Craft the attack roll message.
	// Use this later with `ChatMessage.create(...)`!
	const attackRollMessage = await allAttackRolls.reduce(rollCombiner, null)
	/* FLUFF FOR LATER
	attackRollMessage.flavor = 'A flowing, worm-like mass of arms approaches you at a terrifying pace...'
	*/

	// STEP 3: ATTACK ANALYSIS.
	let attackAnalysisText = allAttackRolls.map((roll) => roll.total).join(', ')
	attackAnalysisText = `{${attackAnalysisText}}cs>=${targetArmorClass}[Armor Class]`

	const attackAnalysis = new Roll(attackAnalysisText)
	await attackAnalysis.roll( )

	const numberOfHits = attackAnalysis.total
	const numberOfMisses = numberOfAttacks - numberOfHits

	// Craft the attack roll analysis message.
	// Use this later with `ChatMessage.create(...)`!
	const attackAnalysisMessage = await attackAnalysis.toMessage({ }, {create: false})


	/* FLUFF FOR LATER
	attackAnalysisMessage.flavor = (
		`Flowing, worm-like masses of arms approach you at a terrifying pace... `
		+ `A wave of ${numberOfAttacks} arms fly towards you to attack. `
	)

	if (numberOfMisses == 0) {
		attackAnalysisMessage.flavor += 'Confoundingly, every single arm manages to pummel into you!'
	}
	else if (numberOfHits == 0) {
		attackAnalysisMessage.flavor += 'Miraculously, you manage to nullify the entirety of the titan\'s onslaught!'
	}
	else if (numberOfHits == 1) {
		attackAnalysisMessage.flavor += 'However, you manage to evade all but one of the great worm\'s many arms!'
	}
	else {
		attackAnalysisMessage.flavor += `Although you manage to avoid the full-force of ${numberOfMisses} hits, ${numberOfAttacks} arms still reach you!`
	}
	*/

	// STEP 4: DAMAGE ROLL EXECUTION.
	const allDamageRolls = (new Array(numberOfHits))
	.fill(null).map(( ) => new Roll(damageRollText))

	const damageRollMessage = await allDamageRolls.reduce(rollCombiner, null)

	// STEP 5: DAMAGE ROLL ANALYSIS.
	const damageAnalysisText = allDamageRolls.map((roll) => roll.total).join(' + ')
	const damageAnalysis = new Roll(damageAnalysisText)
	const damageAnalysisMessage = await damageAnalysis.toMessage({ }, {create: false})

	await ChatMessage.create(attackRollMessage)
	await asyncTimeout(2000)
	await ChatMessage.create(attackAnalysisMessage)
	await asyncTimeout(6000)
	await ChatMessage.create(damageRollMessage)
	await asyncTimeout(2000)
	await ChatMessage.create(damageAnalysisMessage)

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
