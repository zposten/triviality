const { TriviaEvents } = require('triviality-shared')
const questions = require('./questions')

module.exports = function TriviaGame(io, gameCode) {
  let users = []
  let questionNumber = null
  let answers = {}

  function addParticipant(socket, teamName) {
    if (teamName && !users.includes(teamName)) {
      users.push(teamName)
      io.in(gameCode).emit(TriviaEvents.GetUsers, users)
    }

    // socket.on(TriviaEvents.AddUser, (userName) => {
    //   if (users.includes(teamName)) return

    //   users.push(teamName)
    //   io.in(gameCode).emit(TriviaEvents.GetUsers, users)
    // })

    socket.on(TriviaEvents.GetUsers, () => {
      socket.emit(TriviaEvents.GetUsers, users)
    })

    socket.on(TriviaEvents.GetCurrentQuestionNumber, () => {
      socket.emit(TriviaEvents.GetCurrentQuestionNumber, questionNumber)
    })

    socket.on(TriviaEvents.GetQuestionData, () => {
      socket.emit(TriviaEvents.GetQuestionData, questions)
    })

    socket.on(TriviaEvents.StartGame, () => {
      questionNumber = 1
      io.emit(TriviaEvents.GetCurrentQuestionNumber, questionNumber)
    })

    socket.on(TriviaEvents.NextQuestion, () => {
      const areQuestionsRemaining = questions.length > questionNumber
      if (areQuestionsRemaining) {
        questionNumber++
      } else {
        questionNumber = null
      }
      io.emit(TriviaEvents.GetCurrentQuestionNumber, questionNumber)
    })

    socket.on(TriviaEvents.SubmitAnswer, (teamName, questionNumber, answer) => {
      if (!answers[teamName]) answers[teamName] = []

      const teamAnswers = answers[teamName]
      teamAnswers[questionNumber - 1] = answer
    })

    socket.on(TriviaEvents.GetGameResult, () => {
      const resultsByQuestionByTeam = questions.map(({ answer }, questionIndex) => {
        return users.reduce((accum, teamName) => {
          const teamAnswerToThisQuestion = answers[teamName]?.[questionIndex]
          const expected = answer
          const received = teamAnswerToThisQuestion
          const isCorrect = expected == received
          accum[teamName] = { expected, received, isCorrect }
          return accum
        }, {})
      })

      socket.emit(TriviaEvents.GetGameResult, resultsByQuestionByTeam)
    })

    socket.on(TriviaEvents.ResetGame, () => {
      users = []
      questionNumber = null
      answers = {}
      io.emit(TriviaEvents.ResetGame)
    })
  }

  function removeParticipant(socket) {
    socket.removeAllListeners()
  }

  return { addParticipant, removeParticipant }
}
