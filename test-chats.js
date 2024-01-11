
(async ( ) => {

	const rollReducer = async (finalPromise, thisRoll) => {
		const finalMessage = await finalPromise
		const thisMessage = await thisRoll.toMessage({ }, {create: false})
		console.log({thisMessage, finalMessage})

		if (finalMessage == null) return thisMessage
		finalMessage.rolls.push(thisMessage.rolls.pop( ))
		return finalMessage
	}

	roll01 = new Roll('1d20')
	roll02 = new Roll('2d6')

	const allRolls = [roll01, roll02]
	const finalMessage = await allRolls.reduce(rollReducer, null)

	ChatMessage.create({
		...finalMessage,
		flavor: "oh no..."
	})

})( )
