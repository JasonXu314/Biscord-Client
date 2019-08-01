import User from './user';
import $ from 'jquery';

/**
 * Internal record of users (used in mention parsing)
 * @type {Map<string, User>}
 */
const userMap = new Map();

/**
 * Adds a user to this client's internal record of users
 * @param {User} user the user to be added to the map
 */
export function addUser(user)
{
    userMap.set(user.id, user);
}

/**
 * Gets a user from the client's internal record of users by id
 * @param {string} id the UUID of the user to be retrieved
 */
export function retrieveUser(id)
{
    return userMap.get(id);
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