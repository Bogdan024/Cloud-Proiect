import { Server } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollection } from '../../../utils/functions';
import { USERS_COLLECTION, MESSAGES_COLLECTION } from '../../../utils/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
let io;

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }
  
  console.log('Setting up socket');
  io = new Server(res.socket.server);
  res.socket.server.io = io;
  
  const onConnection = (socket) => {
    console.log('New connection', socket.id);
    
    socket.on('authenticate', async ({ token }) => {
      try {
        const decoded = verify(token, JWT_SECRET);
        const usersCollection = await getCollection(USERS_COLLECTION);

        const user = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        socket.userId = user._id.toString();
        
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { isOnline: true } }
        );
        
        socket.broadcast.emit('user_status', {
          userId: user._id.toString(),
          isOnline: true
        });
        
        const users = await usersCollection.find({}).toArray();
        const sanitizedUsers = users.map(u => {
          const { password, ...userWithoutPassword } = u;
          return {
            ...userWithoutPassword,
            _id: userWithoutPassword._id.toString()
          };
        });
        
        socket.emit('users', sanitizedUsers);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });
    
    socket.on('message', async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        
        if (!senderId || !receiverId || !content) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        const messagesCollection = await getCollection(MESSAGES_COLLECTION);
        const message = {
          senderId,
          receiverId,
          content,
          timestamp: new Date(),
          read: false
        };
        
        const result = await messagesCollection.insertOne(message);
        
        const newMessage = { 
          ...message, 
          _id: result.insertedId.toString() 
        };
        
        socket.emit('message_sent', { message: newMessage });
        
        const receiverSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === receiverId);
        
        if (receiverSocket) {
          receiverSocket.emit('message', { message: newMessage });
        }
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    socket.on('read_messages', async (data) => {
      try {
        const { senderId, receiverId } = data;
        
        if (!senderId || !receiverId) {
          socket.emit('error', { message: 'Invalid read receipt data' });
          return;
        }
        
        const messagesCollection = await getCollection(MESSAGES_COLLECTION);
        await messagesCollection.updateMany(
          { senderId, receiverId, read: false },
          { $set: { read: true } }
        );
        
        const senderSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === senderId);
        
        if (senderSocket) {
          senderSocket.emit('messages_read', { senderId, receiverId });
        }
      } catch (error) {
        console.error('Read receipt error:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });
    
    socket.on('typing', (data) => {
      const { senderId, receiverId } = data;
      
      if (!senderId || !receiverId) {
        socket.emit('error', { message: 'Invalid typing data' });
        return;
      }
    

      const receiverSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === receiverId);
      
      if (receiverSocket) {
        receiverSocket.emit('typing', { senderId });
      }
    });

    socket.on('message_edited', ({ messageId, newContent, updatedAt }) => {
  // Broadcast to everyone except the sender
  socket.broadcast.emit('message_edited', {
    messageId,
    newContent,
    updatedAt: new Date(updatedAt),
  });
});


    socket.on('edit_message', async ({ messageId, newContent, userId }) => {
  try {
    const messagesCollection = await getCollection(MESSAGES_COLLECTION);

    const result = await messagesCollection.findOneAndUpdate(
      { _id: new ObjectId(messageId), senderId: userId },
      { $set: { content: newContent, updatedAt: new Date(), isEdited: true } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      socket.emit('error', { message: 'Message not found or unauthorized' });
      return;
    }

    const updatedMessage = {
      ...result.value,
      _id: result.value._id.toString()
    };

    // Notify sender
    socket.emit('message_edited', {
      messageId: updatedMessage._id,
      newContent: updatedMessage.content,
      updatedAt: updatedMessage.updatedAt
    });

    // Notify receiver (if online)
    const receiverSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.userId === updatedMessage.receiverId);

    if (receiverSocket) {
      receiverSocket.emit('message_edited', {
        messageId: updatedMessage._id,
        newContent: updatedMessage.content,
        updatedAt: updatedMessage.updatedAt
      });
    }

  } catch (error) {
    console.error('Edit message error:', error);
    socket.emit('error', { message: 'Failed to edit message' });
  }
});

socket.on('delete_message', async ({ messageId, userId }) => {
  try {
    const messagesCollection = await getCollection(MESSAGES_COLLECTION);

    const message = await messagesCollection.findOne({ _id: new ObjectId(messageId) });

    if (!message || message.senderId !== userId) {
      socket.emit('error', { message: 'Message not found or unauthorized' });
      return;
    }

    await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });

    const senderSockets = Array.from(io.sockets.sockets.values()).filter(
      s => s.userId === userId
    );
    senderSockets.forEach(s => s.emit('message_deleted', { messageId }));
    
    const receiverSockets = Array.from(io.sockets.sockets.values()).filter(
      s => s.userId === message.receiverId
    );
    receiverSockets.forEach(s => s.emit('message_deleted', { messageId }));

  } catch (error) {
    console.error('Delete message error:', error);
    socket.emit('error', { message: 'Failed to delete message' });
  }
});


    
    socket.on('disconnect', async () => {
      console.log('Client disconnected', socket.id);
      
      if (socket.userId) {
        try {
          const hasOtherConnections = Array.from(io.sockets.sockets.values())
            .some(s => s.id !== socket.id && s.userId === socket.userId);
          
          if (!hasOtherConnections) {
            const usersCollection = await getCollection(USERS_COLLECTION);
            await usersCollection.updateOne(
              { _id: new ObjectId(socket.userId) },
              { 
                $set: { 
                  isOnline: false,
                  lastSeen: new Date()
                } 
              }
            );
            
            socket.broadcast.emit('user_status', {
              userId: socket.userId,
              isOnline: false
            });
          }
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    });
  };
  
  io.on('connection', onConnection);
  
  res.end();
}