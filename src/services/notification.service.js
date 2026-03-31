import { EventEmitter } from "node:events";

class NotificationService extends EventEmitter {
    registerUser(userInfo){
        this.emit('user:registered', userInfo);
    }
    verifyUser(userInfo){
        this.emit('user:verified', userInfo);
    }
    inviteUser(userInfo){
        this.emit('user:invited', userInfo);
    }
    deleteUser(userInfo){
        this.emit('user:deleted', userInfo);
    }
}

const notificationService = new NotificationService();

notificationService.on("user:registered", (info) => {
    console.log("[event] user:registered", info);
});

notificationService.on("user:verified", (info) => {
    console.log("[event] user:verified", info);
});

notificationService.on("user:invited", (info) => {
    console.log("[event] user:invited", info);
});

notificationService.on("user:deleted", (info) => {
    console.log("[event] user:deleted", info);
});

export default notificationService;