/**
 * Interface representing authentication credentials for a user
 */
interface UserCredentials
{
    /**
     * The UUID of the user
     */
    id: number;

    /**
     * The username of the user
     */
    username: string;
}

/**
 * Interface representing a basic request
 */
interface MyRequest
{
    /**
     * The type of request the client is making to the server
     */
    type: string;

    /**
     * The UUID of the user making the request
     */
    id: number;
}

/**
 * Interface representing a request for a deletion of a message
 */
interface DeleteRequest extends MyRequest
{
    type: 'delete';

    /**
     * The UUID of the message the client is trying to delete
     */
    msgID: number;
}

interface EditRequest extends MyRequest
{
    type: 'edit';

    /**
     * The UUID of the message the client is trying to edit
     */
    msgID: number;

    /**
     * The new message the message should be edited to
     */
    newMsg: string;

    /**
     * The old message
     */
    oldMsg: string;
}

interface UserShell
{
    /**
     * Username of the user
     */
    username: string;

    /**
     * UUID of the user
     */
    id: number;
}