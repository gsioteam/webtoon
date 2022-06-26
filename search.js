const supportLanguages = require('./support_languages');
const baseURL = 'https://www.webtoons.com/{0}/search?keyword={1}';

class SearchController extends Controller {

    load() {
        let str = localStorage['hints'];
        let hints = [];
        if (str) {
            let json = JSON.parse(str);
            if (json.push) {
                hints = json;
            }
        }
        this.data = {
            list: [],
            focus: false,
            hints: hints,
            text: '',
            loading: false,
            hasMore: false,
        };
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

    makeURL(word, page) {
        let lan = this.getLanguage();
        if (lan === 'zh') lan = 'zh-hant';
        return baseURL.replace('{0}', lan).replace('{1}', encodeURIComponent(word));
    }

    onSearchClicked() {
        this.findElement('input').submit();
    } 

    onTextChange(text) {
        this.data.text = text;
    }

    async onTextSubmit(text) {
        let hints = this.data.hints;
        if (text.length > 0) {
            if (hints.indexOf(text) < 0) {
                this.setState(()=>{
                    hints.unshift(text);
                    while (hints.length > 30) {
                        hints.pop();
                    }
    
                    localStorage['hints'] = JSON.stringify(hints);
                });
            }
            
            this.setState(()=>{
                this.data.loading = true;
            });
            try {
                let list = await this.request(this.makeURL(text, 0));
                this.key = text;
                this.page = 0;
                this.setState(()=>{
                    this.data.list = list;
                    this.data.loading = false;
                    this.data.hasMore = list.length > 0;
                });
            } catch(e) {
                showToast(`${e}\n${e.stack}`);
                this.setState(()=>{
                    this.data.loading = false;
                });
            }
        }
    }

    onTextFocus() {
        this.setState(()=>{
            this.data.focus = true;
        });
    }

    onTextBlur() {
        this.setState(()=>{
            this.data.focus = false;
        });
    }

    async onPressed(index) {
        await this.navigateTo('book', {
            data: this.data.list[index]
        });
    }

    onHintPressed(index) {
        let hint = this.data.hints[index];
        if (hint) {
            this.setState(()=>{
                this.data.text = hint;
                this.findElement('input').blur();
                this.onTextSubmit(hint);
            });
        }
    }

    async onRefresh() {
        let text = this.key;
        if (!text) return;
        try {
            this.setState(()=>{
                this.data.loading = true;
            });
            let list = await this.request(this.makeURL(text, 0));
            this.page = 0;
            this.setState(()=>{
                this.data.list = list;
                this.data.loading = false;
                this.data.hasMore = list.length > 0;
            });
        } catch(e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
    }

    async onLoadMore() {
        let page = this.page + 1;
        try {
            this.setState(()=>{
                this.data.loading = true;
            });
            let list = await this.request(this.makeURL(this.key, page));
            this.page = page;
            this.setState(()=>{
                for (let item of list) {
                    this.data.list.push(item);
                }
                this.data.loading = false;
                this.data.hasMore = list.length > 0;
            });
        } catch(e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
    }

    async request(url) {
        let res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        let text = await res.text();
        
        return this.parseNoPageData(text, url);
    }

    parseNoPageData(html, url) {
        const doc = HTMLParser.parse(html);

        let results = [];
        for (let node of doc.querySelectorAll('ul.card_lst > li > a')) {
            results.push(this.parseFlipper(node, url));
        }
        console.log(JSON.stringify(results));
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

module.exports = SearchController;