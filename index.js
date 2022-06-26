class IndexController extends Controller {
    load() {
        this.data = {
            tabs: [
                {
                    "title": "HOME",
                    "id": "home",
                    "url": "https://www.webtoons.com/{0}"
                },
                // {
                //     "title": "ORIGINALS",
                //     "id": "originals",
                //     "url": "https://www.webtoons.com/{0}/dailySchedule"
                // },
                // {
                //     "title": "GENRES",
                //     "id": "genres",
                //     "url": "https://www.webtoons.com/{0}/genre"
                // },
                // {
                //     "title": "POPULAR",
                //     "id": "popular",
                //     "url": "https://www.webtoons.com/{0}/top"
                // },
            ]
        };
    }
}

module.exports = IndexController;