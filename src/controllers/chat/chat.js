const MessageModel = require("../../models/message/index");

const chatController = {
  sendMessage: async (req, res, next) => {
    try {
      const { matchId, senderId, message } = req.body;
      const ticket = await MessageModel.createTicket({
        matchId,
        senderId,
        message,
      });
      return APIResponse.send(
        res,
        true,
        201,
        "Support ticket submitted",
        ticket,
      );
    } catch (error) {
      next(error);
    }
  },
};
