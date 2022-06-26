const bookFetch = require('./book_fetch');

/**
 * @property {String}key need override the key for caching
 * @method load need override,
 * @method checkNew need override
 */
class MangaProcesser extends Processor {

    // The key for caching data
    get key() {
        return this.data.link;
    }

    /**
     * 
     * Start load pictures
     * 
     * @param {*} state The saved state.
     */
    async load(state) {
        try {
            let url = this.data.link;
            this.loading = true;
            let doc = await this.fetch(url);
            let imgs = doc.querySelectorAll('.viewer_img > img');
           
            for (let index = 0, t = imgs.length; index < t; ++index) {
                let img = imgs[index];
                
                /**
                 * @property {String} url The picture url.
                 * @property {Object*} headers The picture headers.
                 */
                this.setDataAt({
                    url: img.getAttribute('data-url'),
                    headers: {
                        referer: url
                    },
                }, index);
            }
            this.save(true, state);
            this.loading = false;
        } catch (e) {
            console.log(`err ${e}\n${e.stack}`);
            this.loading = false;
        }
    }

    async fetch(url) {
        console.log(`request ${url}`);
        let res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        let text = await res.text();
        return HTMLParser.parse(text);
    }

    // Called in `dispose`
    unload() {

    }

    // Check for new chapter
    async checkNew() {
        let url = this.data.link + '?waring=1';
        let data = await bookFetch(url);
        var item = data.list[data.list.length - 1];
        /**
         * @property {String}title The last chapter title.
         * @property {String}key The unique identifier of last chpater.
         */
        return {
            title: item.title,
            key: item.link,
        };
    }
}

module.exports = MangaProcesser;