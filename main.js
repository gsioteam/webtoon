const supportLanguages = require('./support_languages');

class MainController extends Controller {

    load(data) {
        this.id = data.id;
        this.url = data.url;
        this.page = 0;

        var cached = this.readCache();
        let list;
        if (cached) {
            list = cached.items;
        } else {
            list = [];
        }

        this.data = {
            list: list,
            loading: false,
            hasMore: false
        };

        this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36';

        if (cached) {
            let now = new Date().getTime();
            if (now - cached.time > 30 * 60 * 1000) {
                this.reload();
            }
        } else {
            this.reload();
        }

        this._reload = ()=>{
            this.reload();
        };
        NotificationCenter.addObserver("reload", this._reload);
    }

    unload() {
        NotificationCenter.removeObserver("reload", this._reload);
    }

    async onPressed(index) {
        await this.navigateTo('book', {
            data: this.data.list[index]
        });
    }

    onRefresh() {
        this.reload();
    }

    async onLoadMore() {
        this.setState(() => {
            this.data.loading = true;
        });
        try {

            let page = this.page + 1;
            let url = this.makeURL(page);
            let res = await fetch(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });
            let text = await res.text();
            this.page = page;
            let items = this.parseData(text, url);
    
            this.setState(()=>{
                for (let item of items) {
                    this.data.list.push(item);
                }
                this.data.loading = false;
                this.data.hasMore = false;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
        
    }

    getLanguage() {
        let lan = localStorage['cached_language'];
        if (lan) return lan;

        for (let name of supportLanguages) {
            if (navigator.language.startsWith(name)) {
                return name;
            }
        }
        return 'en';
    }

    makeURL(page) {
        let lan = this.getLanguage();
        if (lan === 'zh') lan = 'zh-hant';
        return this.url.replace('{0}', lan).replace('{1}', page + 1);
    }

    async reload() {
        this.setState(() => {
            this.data.loading = true;
        });
        try {
            let url = this.makeURL(0);
            let res = await fetch(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });
            let text = await res.text();
            let items = this.parseData(text, url);
            this.page = 0;
            localStorage['cache_' + this.id] = JSON.stringify({
                time: new Date().getTime(),
                items: items,
            });
            this.setState(()=>{
                this.data.list = items;
                this.data.loading = false;
                this.data.hasMore = false;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
    }

    readCache() {
        let cache = localStorage['cache_' + this.id];
        if (cache) {
            let json = JSON.parse(cache);
            return json;
        }
    }

    parseData(text, url) {
        if (this.id === 'home') {
            return this.parseHomeData(text, url);
        } else if (this.id === 'originals') {
            return this.parseDailyData(text, url);
        } else {
            return [];
        }
    }

    parseHomeData(html, url) {
        const doc = HTMLParser.parse(html);

        let container = doc.querySelector('.main_daily_wrap');
        let results = [];
        let titleNode = container.querySelector('h2');
        // results.push({
        //     title: titleNode.text.trim(),
        //     header: true,
        // });
        let lists = container.querySelectorAll('.card_lst');
        let day = new Date().getDay() + 6 % 7;
        let cards = lists[day];
        for (let node of cards.querySelectorAll('.card_flipper')) {
            results.push(this.parseFlipper(node, url));
        }

        container = doc.querySelector('#newTitleRanking');
        titleNode = container.querySelector('h2');
        results.push({
            title: titleNode.text.trim().split('\n')[0],
            header: true,
        });
        for (let node of container.querySelectorAll('ul.lst_type1 > li > a')) {
            results.push(this.parseFlipper(node, url));
        }

        container = doc.querySelector('#genreRanking');
        titleNode = container.querySelector('h2');
        results.push({
            title: titleNode.text.trim().split('\n')[0],
            header: true,
        });
        for (let node of container.querySelectorAll('ul.lst_type1 > li > a')) {
            results.push(this.parseFlipper(node, url));
        }

        return results;
    }

    parseDailyData(html, url) {
        const doc = HTMLParser.parse(html);

        let results = [];
        for (let container of doc.querySelectorAll('.daily_lst')) {
            let titleNode = container.querySelector('h2');
            results.push({
                title: titleNode.text.trim(),
                header: true,
            });
            let cards;
            if (container.id === 'dailyList') {
                let day = new Date().getDay() + 6 % 7;
                cards = container.querySelectorAll('.daily_section')[day];
            } else {
                cards = container.querySelector('.daily_section');
            }

            for (let node of cards.querySelectorAll('ul > li > a')) {
                results.push(this.parseFlipper(node, url));
            }

            break;
        }
        
        return results;
    }

    parseFlipper(node, url) {
        return {
            link: node.tagName === 'A' ? node.getAttribute('href') : node.parentNode.getAttribute('href'),
            picture: node.querySelector('img').getAttribute('src'),
            title: node.querySelector('.subj').text,
            subtitle: node.querySelector('.author').text,
            pictureHeaders: {
                referer: url
            }
        };
    }

}

module.exports = MainController;