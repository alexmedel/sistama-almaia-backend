import { Server } from 'socket.io';

const io = new Server(3000, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Escuchar eventos y usar Supabase
  socket.on('get_messages', async () => {
    try {
     /* const { data, error } = await SupabaseClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });*/

   //   if (error) throw error;

      //socket.emit('messages', data);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      socket.emit('error', { message: 'Error al obtener mensajes' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

