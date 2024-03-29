import * as express from "express";
import { Application as Application }from "express";
// import socketIO from "socket.io";
import {Server as SocketIOServer} from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import * as path from "path";
 
export class Server {
 private httpServer: HTTPServer;
 private app: Application;
 private io: SocketIOServer;
 private activeSockets: string[] = [];

 
 private readonly DEFAULT_PORT = 8081;
 
 constructor() {
   this.initialize();
 
   this.handleRoutes();
   this.handleSocketConnection();
 }
 

 private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }
 private initialize(): void {
   this.app = express();
   this.httpServer = createServer(this.app);
   this.io = new SocketIOServer(this.httpServer);
   this.configureApp();
   this.configureRoutes();
   this.handleSocketConnection();
   
 }
 
 private handleRoutes(): void {
   this.app.get("/", (req, res) => {
     res.send(`<h1>Hello World</h1>`); 
   });
 }

 private configureRoutes(): void {
    this.app.get("/", (req, res) => {
      res.sendFile("index.html");
    });
  }
 
 private handleSocketConnection(): void {
    this.io.on("connection", socket => {
        const existingSocket = this.activeSockets.find(
          existingSocket => existingSocket === socket.id
        );
  
        if (!existingSocket) {
          this.activeSockets.push(socket.id);
  
          socket.emit("update-user-list", {
            users: this.activeSockets.filter(
              existingSocket => existingSocket !== socket.id
            )
          });
  
          socket.broadcast.emit("update-user-list", {
            users: [socket.id]
          });
        }
  
        socket.on("call-user", (data: any) => {
          socket.to(data.to).emit("call-made", {
            offer: data.offer,
            socket: socket.id
          });
        });
  
        socket.on("make-answer", data => {
          socket.to(data.to).emit("answer-made", {
            socket: socket.id,
            answer: data.answer
          });
        });
  
        socket.on("reject-call", data => {
          socket.to(data.from).emit("call-rejected", {
            socket: socket.id
          });
        });
  
        socket.on("disconnect", () => {
          this.activeSockets = this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          );
          socket.broadcast.emit("remove-user", {
            socketId: socket.id
          });
        });
        // code to receive emojis sent by a client
        socket.on("send-emoji", data => {
            socket.to(data.to).emit("receive-emoji", {
            socket: socket.id,
            emoji: data.emoji
          });
        })
      });
 }
 
 public listen(callback: (port: number) => void): void {
   this.httpServer.listen(this.DEFAULT_PORT, () =>
     callback(this.DEFAULT_PORT)
   );
 }
}