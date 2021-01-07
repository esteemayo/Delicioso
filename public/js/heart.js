import axios from 'axios';
import { $ } from './bling';

async function ajaxHeart(e) {
    e.preventDefault();
    // console.log(this);
    
    try {
        const res = await axios({
            method: this.method,
            url: this.action
        });

        const isHearted = this.heart.classList.toggle('heart__button--hearted');
        $('.heart-count').textContent = res.data.data.user.hearts.length;

        if (isHearted) {
            this.heart.classList.add('heart__button--float');
            window.setTimeout(() => {
                this.heart.classList.remove('heart__button--float');
            }, 2500);
        }
    } catch (err) {
        console.error(err);
    }
}

export default ajaxHeart;