import Connection from './connection.js';
import User from './user.js';
import {
    thisUser
} from './obj-oriented-client.js';
import {
    innerBehavior,
    retrieveUserByID,
    retrieveUserByName,
    prepEmotes,
    getStringBytes
} from './utilities.js';
import $ from 'jquery';

export default class Message {
    /**
     * To construct a message given input from the send field
     * @param {string} message text to be sent by the message
     * @param {User} sender the sender of the message
     * @param {string} channel the name of the channel this message belongs to
     * @param {undefined | any[]} attachments the attachments in the Message
     */
    constructor(message, sender, channel, attachments = undefined) {
        /**
         * The message conveyed by this Message
         * @type {string}
         */
        this.messageRaw = message.replace(/@[a-zA-Z0-9_-]+/g, (substring) => retrieveUserByName(substring.slice(1)) === undefined ? substring : `<@${retrieveUserByName(substring.slice(1)).id}>`);

        /**
         * The message conveyed by this Message when rendered on-screen
         * Converts all mentions to the username of the respective User
         * @type {string}
         */
        this.messageDisplay = prepEmotes(message.replace(/<@(?:\d){13}>/g, (substring) => `@${retrieveUserByID(parseInt(substring.slice(2, -1))).username}`));

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
        this.mentions = this.messageRaw.match(/<@(?:\d){13}>/g) === null ? [] : new Array(...this.messageRaw.match(/<@(?:\d){13}>/g));

        /**
         * A list of messages this message conveyed in the past
         * Arranged in order of first edited to last edited
         * @type {Array<string>}
         */
        this.edits = [];

        /**
         * This user's icon image
         * @type {HTMLImageElement}
         * @readonly
         */
        this.icon = sender.iconElement;

        /**
         * The attachment files in the Message
         * @type {any[]}
         * @readonly
         */
        this.attachments = attachments || [];

        /**
         * The channel this message belongs to
         * @type {string}
         * @readonly
         */
        this.channel = channel;

        this.element = $(`<tr id = ${this.id} class = "messageElement"></tr>`).get(0);

        if (!attachments)
        {
            /** @type {FileList} */
            const files = $('#fileInput').get(0).files;
            let index = 0;
            for (let file of files)
            {
                let extension = file.name.split('.')[1];
                let name = file.name.split('.')[0];

                if (!this.attachmentElem)
                {
                    this.attachmentElem = $(`<td id = "attachments${this.id}" class = "attachmentTD"><a href = "${window.URL.createObjectURL(file)}" download = "${name}">${name}.${extension}</a></td>`)
                        .appendTo(this.element).get(0);
                }
                else
                {
                    $(this.attachmentElem).append($(`<br><a href = "${window.URL.createObjectURL(file)}" download = "${name}">${name}.${extension}</a>`));
                }
                if (extension === 'png' || extension === 'jpg')
                {
                    const fileReader = new FileReader();
                    fileReader.onload = () => {
                        const img = new Image(100, 100);
                        img.src = fileReader.result;
                        img.onload = () => {
                            $(img).appendTo(this.element).wrap($('<div></div>'));
                        };
                    };
                    fileReader.readAsDataURL(file);
                }

                index++;
                if (index === files.length)
                {
                    $('#fileInput').val('');
                }

                const fr = new FileReader();
                fr.onload = () => {
                    this.attachments.push({
                        name: name,
                        extension: extension,
                        rawData: new Uint8Array(fr.result)
                    });
                }
                fr.readAsArrayBuffer(file);
            }
        }
        else
        {
            const extObj = {
                "zip": "application/zip",
                "jar": "application/zip",
                "pdf": "application/pdf",
                "png": "image/png",
                "jpg": "image/jpg",
                "csv": "text/csv"
            };
            for (let data of attachments)
            {
                let name = data.name;
                let extension = data.extension;
                const file = new File([Uint8Array.from(Object.values(data.rawData)).buffer], `${name}.${extension}`, { type: extObj[extension] });
                if (!this.attachmentElem)
                {
                    this.attachmentElem = $(`<td id = "attachments${this.id}" class = "attachmentTD"><a href = "${window.URL.createObjectURL(file)}" download = "${name}">${name}.${extension}</a></td>`)
                        .appendTo(this.element).get(0);
                }
                else
                {
                    $(this.attachmentElem).append($(`<br><a href = "${window.URL.createObjectURL(file)}" download = "${name}" class = "downloadLink">${name}.${extension}</a>`));
                }
                if (extension === 'png' || extension === 'jpg')
                {
                    const fr = new FileReader();
                    fr.onload = () => {
                        const img = new Image(100, 100);
                        img.src = fr.result;
                        img.onload = () => {
                            $(img).appendTo(this.element).wrap($('<div></div>'));
                        };
                    };
                    fr.readAsDataURL(file);
                }
            }
            this.attachments = attachments;
        }

        this.msg = document.createElement('td');
        this.msg.textContent = `${this.author.username}: ${this.messageDisplay}`;
        $(this.msg).addClass('message');
        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            $(this.msg).addClass('mention');
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d+/) === null ? 1 : parseInt(document.title.match(/\d+/)[0]) + 1}🔴 🅱️iscord`;
                document.addEventListener('visibilitychange', () =>
                {
                    if (document.visibilityState === 'visible')
                    {
                        document.title = '🅱️iscord';
                    }
                }, { once: true });
            }
        }
        this.element.appendChild(this.msg);
        this.element.addEventListener('auxclick', (evt) => {
            if (evt.target === this.msg)
            {
                window.addEventListener('contextmenu', (evt) => evt.preventDefault(), {
                    once: true
                });
                this.delete({
                    username: thisUser.username,
                    id: thisUser.id
                }, false);
            }
        });
        this.element.addEventListener('click', (evt) => {
            if (evt.target === this.msg)
            {
                this.edit({
                    username: thisUser.username,
                    id: thisUser.id
                });
            }
        });
        this.prepLinks();
    }

    /**
     * Creates a message from given metadata, should only be used when creating dummy messages received from server
     * @param {string} message the text contained in the message
     * @param {User} sender the user sending the message
     * @param {number} id the UUID of the message
     * @param {string[]} edits the edit history of the message
     * @param {string} channel the channel the history belongs to
     * @param {string[]} attachments the attachments in the message
     */
    static CreateMessage(message, sender, id, edits, channel, attachments)
    {
        const newMsg = new Message(message, sender, channel, attachments);
        newMsg.id = id;
        newMsg.element.id = id;
        newMsg.edits = edits;

        if (newMsg.edits.length !== 0) {
            const sub = document.createElement('sub');
            sub.textContent = `edited (${newMsg.edits.length})`;
            sub.id = `${newMsg.id}sub`;
            sub.classList.add('editSub');
            sub.addEventListener('mouseover', (evt) => {
                let display = document.createElement('div');
                display.id = 'editDiv';
                let editBoard = document.createElement('table');
                display.appendChild(editBoard);
                display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                editBoard.setAttribute('class', 'messageBoard');
                newMsg.edits.forEach((editMsg) => {
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
            newMsg.element.appendChild(sub);
        }

        return newMsg;
    }

    /**
     * Function to render the message onto the DOM
     * @returns a DOM Element containing the message
     */
    render()
    {
        return this.element;
    }

    /**
     * Deletes this message
     * @param {UserCredentials} creds
     * @param {boolean} quiet if true, will not notify server
     */
    delete(creds, quiet) {
        if (this.author.check(creds)) {
            if (!quiet) {
                Connection.request('delete', {
                    id: this.id,
                    creds: creds
                });
            }
            document.getElementById('messageBoard').removeChild(this.element);
        }
        else
        {
            alert("Please do not try to delete other peoples' messages!");
        }
    }

    /**
     * Tries to edit this message
     * @param {UserCredentials} creds credentials of the user trying to edit the message
     * @param {string} newMsg the message to edit it to (use only upon receiving 'edit' signal from server)
     */
    edit(creds, newMsg = undefined)
    {
        if (newMsg === undefined)
        {
            if (this.author.check(creds))
            {
                let editor = document.createElement('input');
                editor.id = 'editor';
                editor.autocomplete = 'off';
                const behavior = (evt) => {
                    if (evt.code === 'Enter' && evt.target === editor)
                    {
                        const newMsgDisplay = editor.value.trim();

                        if (newMsgDisplay.length === 0)
                        {
                            this.delete({
                                username: thisUser.username,
                                id: thisUser.id
                            }, false);
                            $('#input').get(0).focus();
                            return;
                        }

                        if (newMsgDisplay === this.messageDisplay)
                        {
                            this.element.replaceChild(this.msg, editor);
                            return;
                        }

                        const newMsgRaw = newMsgDisplay.replace(/@[a-zA-Z0-9_-]+/g, (substring) => retrieveUserByName(substring.slice(1)) === undefined ? substring : `<@${retrieveUserByName(substring.slice(1)).id}>`);

                        Connection.request('edit', {
                            id: this.id,
                            newMsgRaw: newMsgRaw,
                            newMsgDisplay: newMsgDisplay,
                            oldMsgDisplay: this.messageDisplay,
                            creds: {
                                username: this.author.username,
                                id: this.author.id
                            }
                        });
                        document.getElementById('input').focus();

                        this.edits.push(this.messageDisplay);
                        this.messageRaw = newMsgRaw;
                        this.messageDisplay = newMsgDisplay;
                        this.msg.textContent = `${this.author.username}: ${this.messageDisplay}`;
                        this.refreshMentions();
                        this.element.replaceChild(this.msg, editor);
                        this.prepLinks();

                        if (this.edits.length === 1)
                        {
                            const sub = document.createElement('sub');
                            sub.textContent = 'edited (1)';
                            sub.id = `${this.id}sub`;
                            sub.classList.add('editSub');
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
                            this.element.appendChild(sub);
                        }
                        else
                        {
                            document.getElementById(`${this.id}sub`).textContent = `edited (${this.edits.length})`;
                            this.element.appendChild(this.element.removeChild(document.getElementById(`${this.id}sub`)));
                        }
                    }
                };
                editor.addEventListener('keydown', behavior);
                const escBehavior = (evt) => {
                    if (evt.code === 'Escape' && evt.target === editor)
                    {
                        if (document.getElementById(`${this.id}sub`) !== null)
                        {
                            let sub = this.element.removeChild(document.getElementById(`${this.id}sub`));
                            this.element.appendChild(this.msg);
                            this.element.appendChild(sub);
                            this.element.removeChild(editor);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                        else
                        {
                            this.element.removeChild(editor);
                            this.element.appendChild(this.msg);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                        document.getElementById('input').focus();
                    }
                };
                document.addEventListener('keydown', escBehavior);
                this.element.replaceChild(editor, this.msg);
                editor.focus();
                editor.value = this.messageDisplay;
                setTimeout(() => editor.setSelectionRange(this.messageDisplay.length * 2, this.messageDisplay.length * 2), 0);
            }
            else
            {
                alert("Please do not try to edit other peoples' messages!");
            }
        }
        else
        {
            this.edits.push(this.messageDisplay);
            if (this.edits.length === 1)
            {
                const sub = document.createElement('sub');
                sub.textContent = 'edited (1)';
                sub.id = `${this.id}sub`;
                sub.classList.add('editSub');
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
                this.element.appendChild(sub);
            }
            else
            {
                document.getElementById(`${this.id}sub`).textContent = `edited (${this.edits.length})`;
                this.element.appendChild(this.element.removeChild(document.getElementById(`${this.id}sub`)));
            }
            this.messageRaw = newMsg;
            this.messageDisplay = newMsg.replace(/<@(?:\d){13}>/g, (substring) => `@${retrieveUserByID(parseInt(substring.slice(2, -1))).username}`);
            this.msg.textContent = `${this.author.username}: ${this.messageDisplay}`;
            this.refreshMentions();
            this.prepLinks();
        }
    }

    /**
     * Used internally to update mentions of this message whenever an edit is made
     */
    refreshMentions()
    {
        this.mentions = this.messageRaw.match(/<@(?:\d){13}>/g) === null ? [] : new Array(...this.messageRaw.match(/<@(?:\d){13}>/g));
        if (this.mentions.includes(`<@${thisUser.id}>`) && !this.msg.classList.contains('mention'))
        {
            $(this.msg).addClass('mention');
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d+/) === null ? 1 : parseInt(document.title.match(/\d+/)[0]) + 1}🔴 🅱️iscord`;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible')
                    {
                        document.title = '🅱️iscord';
                    }
                }, { once: true });
            }
        }
        else if (!this.mentions.includes(`<@${thisUser.id}>`) && this.msg.classList.contains('mention'))
        {
            $(this.msg).removeClass('mention');
            document.title = `${document.title.match(/\d+/) === null ? '' : parseInt(document.title.match(/\d+/)[0]) - 1 <= 0 ? '' : `${parseInt(document.title.match(/\d+/)[0]) - 1}🔴 `}🅱️iscord`;
        }
    }

    /**
     * Replaces any links detected in the message with actual anchor elements
     */
    prepLinks()
    {
        let htmlString = `<td class = "${this.mentions.includes(`<@${thisUser.id}>`) ? 'message mention' : 'message'}">${this.author.username}: ${this.messageDisplay.replace(/https?:\/\/[-a-zA-Z0-9_=?#./]+/, (str) => `<a href = "${str}" target = "_blank">${str}</a>`)}</td>`;

        this.element.removeChild(this.msg);
        this.msg = $(htmlString).get(0);
        $(this.element).prepend(this.msg);
    }
}