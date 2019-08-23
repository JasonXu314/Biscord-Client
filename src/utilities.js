import User from './user';
import Message from './message';
import $ from 'jquery';
import InfoCard from './infoCard';
import { currentChannel } from './obj-oriented-client';

/**
 * Internal record of users (used in mention parsing)
 * @type {Map<number, User>}
 */
const userMap = new Map();

/**
 * Internal record of infoCards, speeds up delivery of information and prevents memory wasting
 * @type {Map<number, InfoCard}
 */
const cardMap = new Map();

/**
 * Internal record of messages (used in deletion)
 * @type {Map<number, Message>}
 */
const messageCache = new Map();

/**
 * Dictionary of emotes
 */
const emoteDict = {
    ':b:': '🅱️',
    ':smile:': '🙂',
    ':)': '🙂',
    ':smile_open_mouth:': '😃',
    ':D': '😃',
    ':smile_eyes:': '😄',
    '^_^': '😄',
    ':asian:': '😐'
}

/**
 * Adds a user to this client's internal record of users
 * @param {User} user the user to be added to the map
 */
export function addUser(user)
{
    userMap.set(user.id, user);
    cardMap.set(user.id, new InfoCard(user));
}

/**
 * The channels used by this client
 * @type {string[]}
 */
const channels = ['main'];

/**
 * Removes a user from this client's internal record of users
 * @param {number | string} id the UUID of the user to be removed from the map
 */
export function removeUser(id)
{
    userMap.delete(typeof id === 'number' ? id : parseInt(id));
    cardMap.delete(typeof id === 'number' ? id : parseInt(id));
}

/**
 * Gets a user from the client's internal record of users by id
 * @param {number | string} id the UUID of the user to be retrieved
 */
export function retrieveUserByID(id)
{
    return userMap.get(typeof id === 'number' ? id : parseInt(id));
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
 * Fetches all messages belonging to a channel, in chronological order
 * @param {string} channel the channel the messages should belong to
 * @returns {Message[]} the messages belonging to channel
 */
export function fetchMessagesByChannel(channel)
{
    const out = [];
    for (let message of messageCache.values())
    {
        if (message.channel === channel)
        {
            out.push(message);
        }
    }
    return out;
}

/**
 * Fetches the latest message of the given user
 * @param {User} user the user whose message is to be fetched
 */
export function fetchUserLatestMessage(user)
{
    let returnMsg = null;
    for (let message of messageCache.values())
    {
        if(message.author.check({
            id: user.id,
            username: user.username
        }) && message.channel === currentChannel)
        {
            returnMsg = message;
        }
    }
    return returnMsg;
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
 * @param {number | string} id the UUID of the message to be retrieved
 */
export function retrieveMessage(id)
{
    return messageCache.get(typeof id === 'number' ? id : parseInt(id));
}

/**
 * Gets an InfoCard from the client's internal cache of InfoCards by id
 * @param {number | string} id the UUID of the user whose card is to be retrieved
 */
export function retrieveCard(id)
{
    return cardMap.get(typeof id === 'number' ? id : parseInt(id));
}

/**
 * Removes a message from the client's internal cache
 * @param {number | string} id the UUID of the message to be removed
 */
export function removeMessage(id)
{
    messageCache.delete(typeof id === 'number' ? id : parseInt(id));
}

/**
 * Adds a channel to the internal cache of channels
 * @param {string} name the name of the channel
 */
export function addChannel(name)
{
    channels.push(name);
}

/**
 * Determines whether the channel exists already or not
 * @param {string} name the name of the channel
 */
export function hasChannel(name)
{
    return channels.includes(name);
}

/**
 * Exchanges all the emotes in the given string for the actual emojis, as defined by emoteDict
 * @param {string} str the string to be swept for emotes
 */
export function prepEmotes(str)
{
    let out = str;
    for (let prop in emoteDict)
    {
        out = out.replace(prop, emoteDict[prop]);
    }
    return out;
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