export default class User
{
    /**
     * Default constructor; should be used by client when registering user
     * @param {string} name the username of the user being retistered
     * @param {string} iconURL the icon of the user
     */
    constructor(name, iconURL)
    {
        /**
         * Username of the user
         * @type {string}
         * @readonly
         */
        this.username = name;

        /**
         * Data for the icon; used for transmission over WebSocket
         * @property {string} src the data URL for the image icon
         */
        this.icon = {
            src: iconURL || `./defaultIcon${Math.round(Math.random() * 2) + 1}.png`
        };

        /**
         * UUID of the user
         * @type {number}
         * @readonly
         */
        this.id = Date.now();
    }

    /**
     * Should only be used when creating a dummy user to represent another user in the chat room
     * @param {string} name the username of the user
     * @param {number} id the UUID of the user
     * @param {string} iconURL the URL of the icon for the user
     */
    static DummyUser(name, id, iconURL)
    {
        const newUser = new User(name, iconURL);
        newUser.id = id;
        return newUser;
    }

    /**
     * Checks the credentials against this user
     * @param {UserCredentials} creds 
     * @returns true if and only if the credentials match
     * @type {boolean}
     */
    check(creds)
    {
        return creds.username === this.username && creds.id === this.id;
    }
}