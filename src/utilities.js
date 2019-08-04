import User from './user';
import Message from './message';
import $ from 'jquery';

/**
 * Internal record of users (used in mention parsing)
 * @type {Map<number, User>}
 */
const userMap = new Map();

/**
 * Internal record of messages (used in deletion)
 * @type {Map<number, Message>}
 */
const messageCache = new Map();

/**
 * Adds a user to this client's internal record of users
 * @param {User} user the user to be added to the map
 */
export function addUser(user)
{
    userMap.set(user.id, user);
}

/**
 * Removes a user from this client's internal record of users
 * @param {User} user the user to be removed from the map
 */
export function removeUser(id)
{
    userMap.delete(id);
}

/**
 * Gets a user from the client's internal record of users by id
 * @param {number} id the UUID of the user to be retrieved
 */
export function retrieveUserByID(id)
{
    return userMap.get(id);
}

/**
 * Gets a user from the client's internal record of users by name
 * @param {string} name the username of the user to be retrieved
 */
export function retrieveUserByName(name)
{
    for (let user of userMap.values())
    {
        if (user.username === name)
        {
            return user;
        }
    }
}

/**
 * Adds a message to this client's internal cache of messages
 * @param {Message} message the message to add to the internal cache
 */
export function addMessage(message)
{
    messageCache.set(message.id, message);
}

/**
 * Gets a message from the client's internal cache of messages by id
 * @param {number} id the UUID of the message to be retrieved
 */
export function retrieveMessage(id)
{
    return messageCache.get(id);
}

/**
 * Removes a message from the client's internal cache
 * @param {number} id the UUID of the message to be removed
 */
export function removeMessage(id)
{
    messageCache.delete(id);
}

export const windowBehavior = (evt) => {
    if (evt.keyCode === 13 && evt.target.id === 'input')
    {
        $('#join').get(0).dispatchEvent(new MouseEvent('click'));
    }
};

export const innerBehavior = (evt) => {
    $('#editDiv').get(0).setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
};