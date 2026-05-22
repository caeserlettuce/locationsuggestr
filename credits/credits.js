


for (i in categories) {
    console.log(categories[i]["license"]);
    try {
        var node_tm = document.querySelector(".image.template").cloneNode(true);

        node_tm.classList.remove("template");
        node_tm.querySelector("img").setAttribute("src", `../${categories[i]["img"]}`);
        node_tm.querySelector(".photo-link").setAttribute("href", `${categories[i]["license"]["link"]}`);
        if (categories[i]["license"]["author"] == "") {
            node_tm.querySelector(".photo-author").remove();
            node_tm.innerHTML = node_tm.innerHTML.replace(" by ", "");
        } else {
            node_tm.querySelector(".photo-author").innerHTML = `${categories[i]["license"]["author"]}`;
        }
        
        node_tm.querySelector(".photo-license").innerHTML = `${categories[i]["license"]["type"]}`;
        node_tm.querySelector(".photo-license").setAttribute("href", `${licenses[categories[i]["license"]["type"]]}`);

        node_tm.querySelector(".loc-name").innerHTML = `${categories[i]["name"]}`;

        document.querySelector(".image-credits").appendChild(node_tm);    
    } catch (err) {

    }
    
}