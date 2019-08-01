function wipe()
{
    const connection = new WebSocket('ws://localhost:3000');
    const username = document.getElementById('input').value;
    document.body.removeChild(document.getElementById('text'));
    document.body.removeChild(document.getElementById('input'));
    document.body.removeChild(document.getElementById('join'));
    if (Array(...document.body.children).find((elmnt) => elmnt.id === 'h4') !== undefined)
    {
        document.body.removeChild(document.getElementById('h4'));
    }

    const input = document.createElement('input');
    input.setAttribute('id', 'input');
    input.setAttribute('name', 'message');
    input.setAttribute('type', 'text');

    const button = document.createElement('button');
    button.setAttribute('id', 'submit');
    button.textContent = 'Send';

    const inputRow = document.createElement('tr');
    inputRow.appendChild(input);
    inputRow.appendChild(button);

    const board = document.createElement('table');
    board.setAttribute('class', 'messageBoard');
    board.setAttribute('id', 'messageBoard');
    board.appendChild(inputRow);
    document.body.appendChild(board);

    document.removeEventListener('keydown', windowBehavior);
    document.addEventListener('keydown', (evt) => {
        if (evt.keyCode === 13 && evt.target === input)
        {
            button.dispatchEvent(new MouseEvent('click'));
        }
    });

    connection.addEventListener('open', () => {
        button.addEventListener('click', () => {
            if (input.value !== 'exit')
            {
                let message = input.value.trim();
                if (message.length !== 0)
                {
                    connection.send(JSON.stringify({
                        type: 'message',
                        message: `${message}`,
                        name: `${username}`,
                        id: Date.now()
                    }));
                }
                input.value = '';
            }
            else
            {
                connection.close();
            }
        });
        connection.send(JSON.stringify({
            type: 'registration',
            name: `${username}`
        }));
    });

    /**
     * @type {Map<String, Array<String>>}
     */
    const edits = new Map();
    
    connection.addEventListener('message', (msg) => {
        if (JSON.parse(msg.data).type === 'message')
        {
            let tr = document.createElement('tr');
            let messageBox = document.createElement('td');
            messageBox.textContent = `${JSON.parse(msg.data).sender}: ${JSON.parse(msg.data).message}`;
            messageBox.setAttribute('class', 'message');
            tr.setAttribute('id', JSON.parse(msg.data).id)
            messageBox.addEventListener('auxclick', () => {
                connection.send(JSON.stringify({
                    type: 'delete',
                    user: username,
                    id: tr.id
                }));
            });
            messageBox.addEventListener('click', (evt) => {
                if (evt.target === messageBox)
                {
                    if (!messageBox.textContent.startsWith(username))
                    {
                        alert(`Please do not try to edit other peoples' messages!`);
                        return;
                    }
                    let oldMsg = messageBox.textContent;
                    tr.removeChild(messageBox);
                    let editor = document.createElement('input');
                    editor.setAttribute('id', 'editor');
                    let behavior = (/** @type {KeyboardEvent} */ evt) => {
                        if (evt.keyCode === 13 && evt.target === editor)
                        {
                            if (edits.has(tr.id))
                            {
                                edits.get(tr.id).push(oldMsg.replace(`${username}: `, ''));
                            }
                            else
                            {
                                edits.set(tr.id, [oldMsg.replace(`${username}: `, '')]);
                            }
                            let newMsg = editor.value;
                            tr.removeChild(editor);
                            messageBox.textContent = `${username}: ${newMsg}`;
                            tr.appendChild(messageBox);
                            let subs = Array(...document.getElementsByTagName('sub'));
                            let sub = subs.find((elmt) => elmt.id === `${tr.id}sub`);
                            if (sub !== undefined)
                            {
                                sub.textContent = `edited (${Number(sub.textContent.substring(sub.textContent.indexOf('(') + 1, sub.textContent.length - 1)) + 1})`;
                            }
                            else
                            {
                                sub = document.createElement('sub');
                                sub.setAttribute('id', `${tr.id}sub`);
                                sub.textContent = 'edited (1)';
                                let innerBehavior = (evt) => {
                                    document.getElementById('editDiv').setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                                };
                                sub.addEventListener('mouseover', (evt) => {
                                    let display = document.createElement('div');
                                    display.setAttribute('id', 'editDiv');
                                    let editBoard = document.createElement('table');
                                    display.appendChild(editBoard);
                                    display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                                    editBoard.setAttribute('class', 'messageBoard');
                                    edits.get(tr.getAttribute('id')).forEach((editMsg) => {
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
                                tr.appendChild(sub);
                            }
                            connection.send(JSON.stringify({
                                type: 'edit',
                                id: tr.id,
                                newMsg: newMsg,
                                oldMsg: oldMsg
                            }));
                            tr.appendChild(tr.removeChild(document.getElementById(`${tr.id}sub`)));
                            document.removeEventListener('keydown', behavior);
                        }
                    };
                    let escBehavior = (evt) => {
                        if (evt.keyCode === 27 && evt.target === editor)
                        {
                            if (document.getElementById(`${tr.id}sub`) !== null)
                            {
                                let sub = tr.removeChild(document.getElementById(`${tr.id}sub`));
                                tr.appendChild(messageBox);
                                tr.appendChild(sub);
                                tr.removeChild(editor);
                                document.removeEventListener('keydown', behavior);
                                document.removeEventListener('keydown', escBehavior);
                            }
                            else
                            {
                                tr.removeChild(editor);
                                tr.appendChild(messageBox);
                                document.removeEventListener('keydown', behavior);
                                document.removeEventListener('keydown', escBehavior);
                            }
                        }
                    };
                    document.addEventListener('keydown', escBehavior);
                    tr.appendChild(editor);
                    editor.focus();
                    if (document.getElementById(`${tr.id}sub`) !== null)
                    {
                        tr.appendChild(tr.removeChild(document.getElementById(`${tr.id}sub`)));
                    }
                    document.addEventListener('keydown', behavior);
                }
            });
            tr.appendChild(messageBox);
            document.getElementById('messageBoard').replaceChild(tr, inputRow);
            document.getElementById('messageBoard').appendChild(inputRow);
            input.focus();
        }
        else if (JSON.parse(msg.data).type === 'disconnect')
        {
            let tr = document.createElement('tr');
            let messageBox = document.createElement('td');
            messageBox.textContent = `${JSON.parse(msg.data).user} has left the room`;
            messageBox.setAttribute('class', 'message');
            tr.appendChild(messageBox);
            document.getElementById('messageBoard').replaceChild(tr, inputRow);
            document.getElementById('messageBoard').appendChild(inputRow);
            input.focus();
        }
        else if (JSON.parse(msg.data).type === 'join')
        {
            let tr = document.createElement('tr');
            let messageBox = document.createElement('td');
            messageBox.textContent = `${JSON.parse(msg.data).user} has joined the room`;
            messageBox.setAttribute('class', 'message');
            tr.appendChild(messageBox);
            document.getElementById('messageBoard').replaceChild(tr, inputRow);
            document.getElementById('messageBoard').appendChild(inputRow);
            input.focus();
        }
        else if (JSON.parse(msg.data).type === 'edit')
        {
            if (edits.has(JSON.parse(msg.data).id))
            {
                edits.get(JSON.parse(msg.data).id).push(JSON.parse(msg.data).oldMsg.split(': ')[1]);
            }
            else
            {
                edits.set(JSON.parse(msg.data).id, [JSON.parse(msg.data).oldMsg.split(': ')[1]]);
            }
            let tr = document.getElementById(JSON.parse(msg.data).id);
            let newMsg = JSON.parse(msg.data).newMsg;
            tr.firstChild.textContent = `${tr.firstChild.textContent.split(':')[0]}: ${newMsg}`;
            let subs = Array(...document.getElementsByTagName('sub'));
            let sub = subs.find((elmt) => elmt.id === `${tr.id}sub`);
            if (sub !== undefined)
            {
                sub.textContent = `edited (${Number(sub.textContent.substring(sub.textContent.indexOf('(') + 1, sub.textContent.length - 1)) + 1})`;
            }
            else
            {
                sub = document.createElement('sub');
                sub.setAttribute('id', `${tr.id}sub`);
                sub.textContent = 'edited (1)';
                let innerBehavior = (evt) => {
                    document.getElementById('editDiv').setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                };
                sub.addEventListener('mouseover', (evt) => {
                    let display = document.createElement('div');
                    display.setAttribute('id', 'editDiv');
                    let editBoard = document.createElement('table');
                    display.appendChild(editBoard);
                    display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                    editBoard.setAttribute('class', 'messageBoard');
                    edits.get(tr.getAttribute('id')).forEach((editMsg) => {
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
                tr.appendChild(sub);
            }
        }
        else if (JSON.parse(msg.data).type === 'delete')
        {
            board.removeChild(document.getElementById(JSON.parse(msg.data).id));
        }
        else if (JSON.parse(msg.data).type === 'error')
        {
            alert(JSON.parse(msg.data).errormsg);
        }
        else if (JSON.parse(msg.data).type === 'rejection')
        {
           Array(...document.body.children).forEach((elmnt) => elmnt.parentElement.removeChild(elmnt));
           let h3 = document.createElement('h3');
           h3.textContent = 'Please enter a username';
           h3.id = 'text';
           document.body.appendChild(h3);
           let h4 = document.createElement('h4');
           h4.textContent = JSON.parse(msg.data).reason;
           h4.classList.add('errorMsg');
           h4.id = 'h4';
           document.body.appendChild(h4);
           let input = document.createElement('input');
           input.id = 'input';
           input.name = 'username';
           input.type = 'text';
           document.body.appendChild(input);
           let button = document.createElement('button');
           button.id = 'join';
           button.textContent = 'Join';
           button.addEventListener('click', () => wipe());
           document.body.appendChild(button);
           input.focus();

           document.addEventListener('keydown', windowBehavior);
        }
        else
        {
            connection.close();
        }
    });
}

window.onload = () => {
    document.getElementById('join').addEventListener('click', () => wipe());
    document.getElementById('input').focus();

    document.addEventListener('keydown', windowBehavior);
};

const windowBehavior = (evt) => {
    if (evt.keyCode === 13 && evt.target === document.getElementById('input'))
    {
        document.getElementById('join').dispatchEvent(new MouseEvent('click'));
    }
};

window.addEventListener('contextmenu', (evt) => {
    if (evt.target.className === 'message')
    {
        evt.preventDefault();
    }
});