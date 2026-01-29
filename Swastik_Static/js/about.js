import { shopSettings } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    // Inject dynamic map URL from data.js
    const mapIframe = document.getElementById('google-map');
    const mapLink = document.getElementById('map-link');

    if (mapIframe && typeof shopSettings !== 'undefined' && shopSettings.mapUrl) {
        mapIframe.src = shopSettings.mapUrl_embed;
    }
    if (mapLink && typeof shopSettings !== 'undefined' && shopSettings.mapUrl) {
        mapLink.href = shopSettings.mapUrl;
    }
    document.getElementById("shopLimg").src = shopSettings.shopLogo;
    document.getElementById("aboutName").innerText = shopSettings.shopName;
    document.getElementById("storyName").innerText = shopSettings.shopName;
});