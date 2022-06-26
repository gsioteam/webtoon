
function parseData(text) {
    const doc = HTMLParser.parse(text);
    let h1 = doc.querySelector(".detail_header h1");
    let title = h1.text.trim();

    let subtitle = doc.querySelector('.detail_header .author').text.trim();
    
    let summaryNode = doc.querySelector(".aside.detail .summary");
    let summary = summaryNode.text.trim();

    let list = [];
    let nodes = doc.querySelectorAll('.detail_lst > ul > li');
    for (let node of nodes) {
        list.push({
            title: node.querySelector('.subj').text.trim(),
            subtitle: node.querySelector('.date').text.trim(),
            link: node.querySelector('a').getAttribute('href'),
        });
    }
    return {
        title: title,
        subtitle: subtitle,
        summary: summary,
        list: list.reverse(),
    };
}

module.exports = async function(url) {
    let res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });
    let text = await res.text();

    return parseData(text);
}