// This service handles all interactions with the Google Drive API for data backup.

const API_KEY = process.env.API_KEY;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILE_NAME = 'shopsathi_backup.json';

// gapi isn't typed by default, so we declare it to avoid TypeScript errors.
declare const gapi: any;

/**
 * Initializes the Google API client, authenticates the user, and sets up sign-in status listeners.
 * @param updateSigninStatus A callback function to update the sign-in status in the React component.
 */
export const initClient = (updateSigninStatus: (isSignedIn: boolean) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!CLIENT_ID || !API_KEY) {
            reject(new Error("Google Client ID or API Key is not configured."));
            return;
        }

        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            }).then(() => {
                const authInstance = gapi.auth2.getAuthInstance();
                // Listen for sign-in state changes.
                authInstance.isSignedIn.listen(updateSigninStatus);
                // Handle the initial sign-in state.
                updateSigninStatus(authInstance.isSignedIn.get());
                resolve();
            }, (error: any) => {
                reject(error);
            });
        });
    });
};

/**
 * Signs the user in with their Google account.
 */
export const signIn = () => {
    gapi.auth2.getAuthInstance().signIn();
};

/**
 * Signs the user out.
 */
export const signOut = () => {
    gapi.auth2.getAuthInstance().signOut();
};

/**
 * Finds the ID of the backup file in the user's Google Drive.
 * @returns The file ID if found, otherwise null.
 */
const getBackupFileId = async (): Promise<string | null> => {
    const response = await gapi.client.drive.files.list({
        q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
        spaces: 'appDataFolder', // Use the app's private folder
        fields: 'files(id, name)',
    });

    if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
    }
    return null;
};

/**
 * Backs up the application data to Google Drive.
 * It will either create a new backup file or update an existing one.
 * @param content The application state as a JSON string.
 * @returns The timestamp of the successful backup.
 */
export const backupData = async (content: string): Promise<number> => {
    const fileId = await getBackupFileId();
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;

    const request = gapi.client.request({
        path: `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
        method: fileId ? 'PATCH' : 'POST',
        params: { uploadType: 'multipart', fields: 'id' },
        headers: {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
    });
    
    await request;
    return Date.now();
};
