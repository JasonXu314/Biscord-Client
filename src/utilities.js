export const windowBehavior = (evt) => {
    if (evt.target.className === 'message')
    {
        evt.preventDefault();
    }
};

export const innerBehavior = (evt) => {
    document.getElementById('editDiv').setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
};