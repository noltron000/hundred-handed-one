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
		value='1d4 - 1'
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

const getContentFromRolls = async (rolls) => {
	let anchors = rolls.map(async (roll) => {
		await roll.roll( )
		const anchor = await roll.toAnchor( )
		return anchor.outerHTML
	})

	anchors = await Promise.all(anchors)
	return anchors.join(' ')
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
	const attackRollModifier = +5 // -1 dex; +6 prof
	const attackRollText = `${attackCoreDice} + ${attackRollModifier}`

	// STEP 2: ATTACK EXECUTION.
	// Let's generate a series of dice rolls from the info given above.
	const allAttackRolls = (new Array(numberOfAttacks))
	.fill(null).map(( ) => new Roll(attackRollText))

	// Craft the attack roll message.
	// Use this later with `ChatMessage.create(...)`!
	const attackRollMessage = new ChatMessage({
		flavor: (
			'Flowing, worm-like masses of arms approach at a terrifying pace... '
			+ `A wave of ${numberOfAttacks} arms fly towards you to attack.`
			+ '<hr />'
			+ '<h3>ATTACK ROLLS</h3>'
		),
		content: await getContentFromRolls(allAttackRolls)
	})

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

	// Set the flavor here using these informative variables.
	attackAnalysisMessage.flavor = ''
	// Use a conditional flavor for more immersion!
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
		attackAnalysisMessage.flavor += `Although you manage to avoid the full-force of ${numberOfMisses} hits, ${numberOfHits} arms still reach you!`
	}

	// STEP 4: DAMAGE ROLL EXECUTION.
	const allDamageRolls = (new Array(numberOfHits))
	.fill(null).map(( ) => new Roll(damageRollText))

	const damageRollMessage = new ChatMessage({
		flavor: '<h3>DAMAGE ROLLS</h3>',
		content: await getContentFromRolls(allDamageRolls)
	})

	// STEP 5: DAMAGE ROLL ANALYSIS.
	let damageAnalysisText = allDamageRolls.map((roll) => roll.total).join(' + ')
	if (damageAnalysisText == '') damageAnalysis = '0[No Rolls]'

	const damageAnalysis = new Roll(damageAnalysisText)
	await damageAnalysis.roll( )

	const damageAnalysisMessage = await damageAnalysis.toMessage({ }, {create: false})
	damageAnalysisMessage.flavor = 'Here is the total damage which the titan dealt.'

	await ChatMessage.create(attackRollMessage)
	await asyncTimeout(6000)
	await ChatMessage.create(attackAnalysisMessage)
	await asyncTimeout(3000)
	await ChatMessage.create(damageRollMessage)
	await asyncTimeout(3000)
	await ChatMessage.create(damageAnalysisMessage)
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
