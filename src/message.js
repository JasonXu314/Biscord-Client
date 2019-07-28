import Connection from './connection.js';
import User from './user.js';
import { thisUser } from './obj-oriented-client.js';
import { innerBehavior } from './utilities.js';

export default class Message
{
    /**
     * To construct a message given input from the send field
     * @param {string} message text to be sent by the message
     * @param {User} sender the sender of the message
     */
    constructor(message, sender)
    {
        /**
         * The message conveyed by this Message
         * @type {string}
         */
        this.message = message;

        /**
         * The sender of this Message
         * @type {User}
         */
        this.author = sender;

        /**
         * The UUID of this message
         * @type {number}
         * @readonly
         */
        this.id = Date.now();

        /**
         * A list of people this Message mentions - should not be modified
         * @type {Array<string>}
         * @readonly
         */
        this.mentions = new Array(...message.match(/<@(?:\d){13}>/));

        /**
         * A list of edits this message has undergone
         * Arranged in order of first edited to last edited
         * @type {Array<string>}
         * @readonly
         */
        this.edits = new [];
    }

    /**
     * Function to render the message onto the DOM
     * @returns a DOM Element containing the message
     */
    render()
    {
        const tr = document.createElement('tr');
        tr.id = this.id;
        const msg = document.createElement('td');
        msg.textContent = `${this.sender}: ${this.message}`;
        msg.id = Date.now();
        msg.classList.add('message');
        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            msg.style = 'bgcolor:rgb(206, 184, 87)';
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d*/).length === 0 ? 1 : ++Number(document.title.match(/\d*/)[0])}🔴 🅱iscord`;
            }
        }
        if (this.edits.length !== 0)
        {
            const sub = document.createElement('sub');
            sub.textContent = `edited (${this.edits.length})`;
            sub.id = `${this.id}sub`;
            sub.addEventListener('mouseover', (evt) => {
                let display = document.createElement('div');
                display.id = 'editDiv';
                let editBoard = document.createElement('table');
                display.appendChild(editBoard);
                display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                editBoard.setAttribute('class', 'messageBoard');
                this.edits.forEach((editMsg) => {
                    let editTr = document.createElement('tr');
                    let editTd = document.createElement('td');
                    editTd.textContent = editMsg;
                    editTd.setAttribute('class', 'message');
                    editTr.appendChild(editTd);
                    editBoard.appendChild(editTr);
                });
                display.appendChild(editBoard);
                document.body.appendChild(display);
                document.addEventListener('mousemove', innerBehavior);
            });
            sub.addEventListener('mouseout', () => {
                document.body.removeChild(document.getElementById('editDiv'));
                document.removeEventListener('mousemove', innerBehavior)
            });
        }
        msg.addEventListener('auxclick', this.delete());
        msg.addEventListener('click', (evt) => {
            if (evt.target === msg)
            {
                let oldMsg = msg.textContent;
                tr.removeChild(msg);
                let editor = document.createElement('input');
                editor.setAttribute('id', 'editor');
                let escBehavior = (evt) => {
                    if (evt.keyCode === 27 && evt.target === editor)
                    {
                        if (document.getElementById(`${tr.id}sub`) !== null)
                        {
                            let sub = tr.removeChild(document.getElementById(`${tr.id}sub`));
                            tr.appendChild(msg);
                            tr.appendChild(sub);
                            tr.removeChild(editor);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                        else
                        {
                            tr.removeChild(editor);
                            tr.appendChild(msg);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                    }
                };
                document.addEventListener('keydown', escBehavior);
                tr.appendChild(editor);
                editor.focus();
            }
        });
        return tr;
    }

    /**
     * Deletes this message
     */
    delete()
    {
        if (thisUser.id === this.author.id && thisUser.username === this.author.username)
        {
            Connection.request('delete', {
                id: this.author.id,
                msgID: this.id
            });
        }
        else if (thisUser.id === this.author.id && thisUser.username !== this.author.username)
        {
            Connection.alert('impersonation');
        }
        else
        {
            alert("Please do not try to delete other peoples' messages!");
        }
    }

    /**
     * Edits this message to say
     * @param {string} newMsg
     */
    edit(newMsg)
    {
        if (thisUser.id === this.author.id && thisUser.username === this.author.username)
        {
            Connection.request('edit', {
                id: this.author.id,
                msgID: this.id,
                newMsg: newMsg,
                oldMsg: this.message
            });
        }
        else if (thisUser.id === this.author.id && thisUser.username !== this.author.username)
        {
            Connection.alert('impersonation');
        }
        else
        {
            alert("Please do not try to delete other peoples' messages!");
        }
    }
}