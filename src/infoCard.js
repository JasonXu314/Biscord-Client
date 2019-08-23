import User from './user';

/**
 * Class representing a info popup for a user
 */
export default class InfoCard
{
    /**
     * Constructs and initializes an info card for the given user
     * @param {User} user the user this card is for
     * @param {number} initX the initial x position of the card
     * @param {number} initY the initial y position of the card
     */
    constructor(user)
    {
        /**
         * User of this card
         * @type {User}
         * @readonly
         */
        this.user = user;

        this.element = document.createElement('div');
        this.element.id = `${this.user.id}info`;
        this.element.classList.add('infoCard');
        const img = new Image(50, 50);
        img.src = this.user.icon.src;
        img.style = `position: relative; left: 75px; top: 25px;`;
        this.element.appendChild(img);
        const text = document.createElement('p');
        text.style = 'text-align: center; font-weight: bold;'
        text.textContent = this.user.username;
        this.element.appendChild(document.createElement('br'));
        this.element.appendChild(document.createElement('br'));
        this.element.appendChild(text);
        const id = document.createElement('p');
        id.textContent = `<@${this.user.id}>`;
        id.style = 'text-align: center; font-weight: bold;';
        this.element.appendChild(id);
    }

    render()
    {
        return this.element;
    }
}