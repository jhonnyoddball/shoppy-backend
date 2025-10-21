import {
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ProductsGateway {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  private readonly server: Server;

  handleProductUpdated() {
    this.server.emit('productUpdated');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const token = client.handshake.headers.authorization?.split(' ')[1];
    try {
      this.authService.verifyToken(token || '');
    } catch (error) {
      console.log('Connection error:', error);
      throw new WsException('Unauthorized');
    }
  }
}
