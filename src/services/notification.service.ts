import { EventEmitter } from 'node:events';

type BasicUserEventInfo = {
    userId: string;
    email: string;
};

type InviteUserInfo = {
    invitedUserId: string;
    invitedEmail: string;
    companyId: string;
    invitedBy: string;
};

type DeleteUserInfo = {
    userId: string;
    soft: boolean;
};

class NotificationService extends EventEmitter {
    registerUser(userInfo: BasicUserEventInfo): void {
        this.emit('user:registered', userInfo);
    }

    verifyUser(userInfo: BasicUserEventInfo): void {
        this.emit('user:verified', userInfo);
    }

    inviteUser(userInfo: InviteUserInfo): void {
        this.emit('user:invited', userInfo);
    }

    deleteUser(userInfo: DeleteUserInfo): void {
        this.emit('user:deleted', userInfo);
    }
}

const notificationService = new NotificationService();

notificationService.on('user:registered', (info: BasicUserEventInfo) => {
    console.log('[event] user:registered', info);
});

notificationService.on('user:verified', (info: BasicUserEventInfo) => {
    console.log('[event] user:verified', info);
});

notificationService.on('user:invited', (info: InviteUserInfo) => {
    console.log('[event] user:invited', info);
});

notificationService.on('user:deleted', (info: DeleteUserInfo) => {
    console.log('[event] user:deleted', info);
});

export default notificationService;