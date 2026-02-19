const Message = require("../message/message");

module.exports = {
  sendMessage: async (messageData) => {
    let message = await Message.create({
      ...messageData,
    });

    return message.toObject();
  },

  getMessages: async (matchId) => {
    let message = await Message.find({ matchId: matchId });

    return message.toObject();
  },
};
