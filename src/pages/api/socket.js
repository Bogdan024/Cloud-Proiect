// pages/api/socket.js
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
        // Verify token
        const decoded = verify(token, JWT_SECRET);
        const usersCollection = await getCollection(USERS_COLLECTION);
        
        // Get user
        const user = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
        
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        // Store user ID in socket for later use
        socket.userId = user._id.toString();
        
        // Update user status to online
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { isOnline: true } }
        );
        
        // Broadcast to all clients that user is online
        socket.broadcast.emit('user_status', {
          userId: user._id.toString(),
          isOnline: true
        });
        
        // Get all users
        const users = await usersCollection.find({}).toArray();
        const sanitizedUsers = users.map(u => {
          const { password, ...userWithoutPassword } = u;
          return {
            ...userWithoutPassword,
            _id: userWithoutPassword._id.toString()
          };
        });
        
        // Send users list to client
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
        
        // Save message to database
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
        
        // Send message to sender as confirmation
        socket.emit('message_sent', { message: newMessage });
        
        // Find receiver socket and send message
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
        
        // Update messages in database
        const messagesCollection = await getCollection(MESSAGES_COLLECTION);
        await messagesCollection.updateMany(
          { senderId, receiverId, read: false },
          { $set: { read: true } }
        );
        
        // Find sender socket and notify that messages were read
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
      
      // Find receiver socket and notify about typing
      const receiverSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === receiverId);
      
      if (receiverSocket) {
        receiverSocket.emit('typing', { senderId });
      }
    });
    
    socket.on('disconnect', async () => {
      console.log('Client disconnected', socket.id);
      
      if (socket.userId) {
        try {
          // Check if user has other connections
          const hasOtherConnections = Array.from(io.sockets.sockets.values())
            .some(s => s.id !== socket.id && s.userId === socket.userId);
          
          if (!hasOtherConnections) {
            // Update user status to offline
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
            
            // Broadcast to all clients that user is offline
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