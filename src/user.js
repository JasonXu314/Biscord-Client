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
    constructor(name, id)
    {
        this.username = name;
        this.id = id;
    }
}