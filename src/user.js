export default class User
{
    /**
     * Default constructor; should be used by client when registering user
     * @param {string} name the username of the user being retistered
     */
    constructor(name)
    {
        /**
         * Username of the user
         * @type {string}
         * @readonly
         */
        this.username = name;

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
     */
    static DummyUser(name, id)
    {
        const newUser = new User(name);
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