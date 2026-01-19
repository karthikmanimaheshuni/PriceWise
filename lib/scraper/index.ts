import axios from "axios";
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url:string){
    if(!url) return;

    //curl -i --proxy brd.superproxy.io:33335 --proxy-user brd-customer-hl_c912333f-zone-datacenter_proxy1:h3fm9xp6ygp0 "https://geo.brdtest.com/welcome.txt?product=dc&method=native"
    //bright data configuration 
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 33335;
    const session_id = (1000000*Math.random())|0;
    const options = {
        auth:{
            username:`${username}-session-${session_id}`,
            password,
        },
        host:'brd.superproxy.io',
        port,
        rejectUnauthorized:false,

    }
    try {
        //fetch the product page 
        const response = await axios.get(url, {
            ...options,
            timeout: 15000,
            headers: {
                "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept-Language": "en-IN,en;q=0.9",
                "Accept":
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
            validateStatus: () => true,
            });

            if (response.status !== 200) {
            console.warn("Amazon blocked request:", response.status);
            return null;
            }

            if (
            typeof response.data === "string" &&
            response.data.toLowerCase().includes("captcha")
            ) {
            console.warn("Amazon CAPTCHA detected");
            return null;
            }

        ///console.log(response.data);

        const $ = cheerio.load(response.data)

        //extracting product details 
        const title = $('#productTitle').text().trim();
        
        
        //product price 
       

            const currentPrice = extractPrice(
            // BEST & MOST RELIABLE
            $(".a-price .a-offscreen"),
            $("#price_inside_buybox"),
            $("#priceblock_dealprice"),
            $("#priceblock_ourprice"),
            $(".reinventPricePriceToPayMargin span"),
            $(".a-button-selected .a-price .a-offscreen"),
            );



        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
        );
        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

        const images = 
        $('#imgBlkFront').attr('data-a-dynamic-image') || 
        $('#landingImage').attr('data-a-dynamic-image') ||
        '{}'

        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency($('.a-price-symbol'))
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

        const description = extractDescription($)

        // Construct data object with scraped information
        const data = {
        url,
        currency: currency || '$',
        image: imageUrls[0],
        title,
        currentPrice: Number(currentPrice) || Number(originalPrice),
        originalPrice: Number(originalPrice) || Number(currentPrice),
        priceHistory: [],
        discountRate: Number(discountRate),
        category: 'category',
        reviewsCount:100,
        stars: 4.5,
        isOutOfStock: outOfStock,
        description,
        lowestPrice: Number(currentPrice) || Number(originalPrice),
        highestPrice: Number(originalPrice) || Number(currentPrice),
        averagePrice: Number(currentPrice) || Number(originalPrice),
        }

       

        return data;

        
        
    } catch (error:any) {
        console.error("SCRAPER ERROR:", error.message);
        return null; // ❗ DO NOT throw in production
        
    }
}