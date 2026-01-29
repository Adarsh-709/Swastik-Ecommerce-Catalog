import {sofas} from './categories/sofas.js';
import {beds} from './categories/beds.js';
import {tables} from './categories/tables.js';
import {chairs} from './categories/chairs.js';
import {storage} from './categories/storage.js';
import {tv_panels} from './categories/tv_panels.js';

/* ========================================= */
/* SHOP SETTINGS                             */
/* ========================================= */
export const shopSettings = {
    shopName: "Swastik Furnitures",
    phone: "919002066361", 
    displayPhone: "+91 90020 66361",
    address: "Sevoke Road, Siliguri, Wester Bengal, 734001",
    email: "sales@swastikfurnitures.in",
    shopLogo: "imgs/web_essentials/Swastik_logo.png",
    mapUrl_embed: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7125.424133528909!2d88.466106!3d26.753563!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e440307dd6ac73%3A0x355ef9d79fada0c0!2sKholachand%20Fapri%20Primary%20School!5e0!3m2!1sen!2sin!4v1769689611547!5m2!1sen!2sin",
    mapUrl: "https://maps.app.goo.gl/8aiMdmr77RYpfSJCA",
    access_time: "Mon - Sat: 10:00 AM - 8:00 PM",
    fb_url: "https://www.facebook.com/share/17q2da3kee/",
    yt_url: "",
    wa_url: "",
    copyright_year: "2026",
}

/* ========================================= */
/* PRODUCT DATABASE                          */
/* ========================================= */
export const products = [
    ...sofas,
    ...beds,
    ...tables,
    ...chairs,
    ...storage,
    ...tv_panels
];