// ideas:
//   a food you don't have to kill, that restores 1 hp, so free move but only once
//   a space you can't shock from
//   a space that costs extra hp to pass through
//   a food that moves away from you
//   tunnels
//   pushable boulders/whatever
//   a food that when you eat it you get longer

// todo:
//   url fragments so back button works
//   more levels
//   music

// issues:
//   no tutorial for plants yet

var TR = 42; // tile center-to-corner

var GLG = 4; // gridline gap
var GLWA = 0.4; // gridline wiggle amplitude
var GLWI = 0.2; // gridline wiggle inset

var MR = 6; // map center-to-corner

var BW = 766; // board/window width
var BH = 514; // board/window height

var FOODHP = 3;
var MOVEHP = 1;
var SHOCKHP = 1;
var MAXHP = 20;

var DEBUG = true;

var STARTTIME = new Date().getTime();

function svg(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function tx(x, y) {
    return BW/2 + TR * (x - y);
}

function ty(x, y) {
    return BH/2 + TR * (x + y);
}

$.cookie.json = true;

function time() {
    return (new Date().getTime() - STARTTIME)/1000;
}

var perlin1 = (function() { // 1d perlin noise
    var N = 0x1000;
    var BM = 0xff;
    var B = 0x100;

    var p = [];
    var g1 = [];

    function init() {
        var i, j, k;
        for (i = 0; i < B; i ++) {
            p.push(i);
            g1.push(Math.random() * 2 - 1);
        }
        while (i--) {
            k = p[i];
            j = Math.floor(Math.random() * B);
            p[i] = p[j];
            p[j] = k;
        }
        for (i = 0; i < B + 2; i ++) {
            p.push(p[i]);
            g1.push(g1[i]);
        }
    }

    function s_curve(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    function lerp(t, a, b) {
        return a + t * (b - a);
    }

    function noise1(x) {
        var t = x + N;
        var b0 = Math.floor(t) & BM;
        var b1 = (b0 + 1) & BM;
        var r0 = t - Math.floor(t);
        var r1 = r0 - 1.0;
        var sx = s_curve(r0);
        var u = r0 * g1[ p[ b0 ] ];
        var v = r1 * g1[ p[ b1 ] ];
        return lerp(sx, u, v);
    }

    init();
    return noise1;
})();

var LEVELS = [
    {
        "id": "T1",
        "name": "Green Eels and Ham",
        "map": [
            "*************",
            "*************",
            "*************",
            "*******  p***",
            "*****p    ***",
            "****p  1  ***",
            "****     ****",
            "***     p****",
            "***    p*****",
            "***p  *******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,1,-1,2,0,2],
        "hp": 1000
        // wsw*s (7)
    },
    {
        "id": "T2",
        "name": "Goodnight Eel",
        "map": [
            "*************",
            "*************",
            "*******  ****",
            "******p  ****",
            "******  p  **",
            "******     **",
            "***p     p***",
            "**   2 ******",
            "**  p  ******",
            "****  p******",
            "****  *******",
            "*************",
            "*************"
        ],
        "eel": [1,-1,1,-2,0,-2],
        "hp": 12
        // qaq__a (6)
    },
    {
        "id": "T3",
        "name": "Don't Let the Eel Drive the Bus",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "*****ppp*****",
            "****    p****",
            "***   3 p****",
            "****    p****",
            "*****ppp*****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,0,-2,0,-3,0],
        "hp": 5
        // as__w (5)
    },
    {
        "id": "T4",
        "name": "The Very Hungry Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "*************",
            "***** 1p*****",
            "**     p*****",
            "***** 1p*****",
            "*************",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,0,-3,0,-4,0],
        "hp": 5
        // ss_wqasa (5)
    },
    {
        "id": "T5",
        "name": "Where the Wild Eels Are",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "****** 0 ****",
            "***      ****",
            "*** 1ppp ****",
            "***      ****",
            "****** 0 ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,1,-3,1,-3,0,-3,-1,-2,-1],
        "hp": 19
        // _w (2)
        // ssasswwwwqaqqq_a (16**)
    },

    // SOLVERSTART
    {
        "id": "G giving",
        "name": "The Giving Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****      **",
            "***** 1  1 **",
            "*****     p**",
            "***** 0 *****",
            "**p     *****",
            "** 1 0  *****",
            "**      *****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [1,3,1,2,1,1,0,1],
        "hp": 20
        // qqqq_wwsswww_swsss_a (14)
        // qqqq_wsswwswsss_wqqq (14**)
    },
    {
        "id": "G cloudy",
        "name": "Cloudy With a Chance of Eels",
        "map": [
            "*************",
            "*************",
            "*************",
            "******p0  ***",
            "*****p    ***",
            "****p11   ***",
            "***p 11  p***",
            "***0    p****",
            "***    p*****",
            "***   p******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,3,-1,2,0,2,0,1,1,1],
        "hp": 18
        // qwww_s_w_sa (6)
        // qqwwsw_s_w_swswsaaqqa (12**)
    },
    {
        "id": "G curious",
        "name": "Curious Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "****    0****",
            "**** 11  ****",
            "**** 1p1 ****",
            "****  11 ****",
            "****0    ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,-2,-2,-2,-2,-1],
        "hp": 10
        // _a_ss_as_aqa_qwqw (3)
        // _a_ss_wsaaq_a_qqqasww (6**)
    },
    {
        "id": "G hunt",
        "name": "We're Going on an Eel Hunt",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****    ****",
            "****p 1  p***",
            "***  1  1 ***",
            "*** 1  1  ***",
            "***   1  0***",
            "***p 1  p****",
            "****   0*****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [2,-3,1,-3,0,-3,-1,-3],
        "hp": 18
        // _aqqq_asss_aqq_aa_qwq_w (5)
        // _aqqq_aq_aaa_sasswq_ws_wsaswwq (12**)
    },
    {
        "id": "G could",
        "name": "The Little Eel That Could",
        "map": [
            "*************",
            "*************",
            "******  p****",
            "*****p   ****",
            "****   1 **p*",
            "****1 0  **p*",
            "****     ****",
            "*p**  0 1****",
            "*p** 1   ****",
            "****   p*****",
            "****p  ******",
            "*************",
            "*************"
        ],
        "eel": [0,3,0,4,-1,4],
        "hp": 17
        // q_wwwq_wssw_saas_a (9)
        // q_wsss_wqqqwq_wssw_s (11**)
    },
    {
        "id": "G belly",
        "name": "Where is Eel's Belly Button",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****   *****",
            "****ppppp****",
            "***  121  ***",
            "***0 2 2 0***",
            "***  121  ***",
            "****    p****",
            "*****   *****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,2,-1,2,-1,3,0,3,1,3,1,2,0,2],
        "hp": 10
        // _ws__w_sas_ws_wqqq (3)
        // __wssssswqw_qaq_w__qqqass (4**)
    },
    {
        "id": "G hat",
        "name": "The Eel in the Hat",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****   p****",
            "*****   pp***",
            "***   2   ***",
            "***0 212 0***",
            "***   2   ***",
            "***pp   *****",
            "****p   *****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,2,-1,3,0,3,1,3,1,2],
        "hp": 15
        // w__s_w_qw_ssa (4)
        // wq__qwssw__saas_sswqq (9**)
    },
    {
        "id": "G way",
        "name": "Make Way for Eels",
        "map": [
            "*************",
            "*************",
            "********p****",
            "*************",
            "****0 *******",
            "**** 2 2 ****",
            "***** 3  ****",
            "*****2 2 ****",
            "**p**0   ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [2,1,2,2,1,2],
        "hp": 15
        // _qq___ww__qaaswws (5)
        // _qqa__qww_sw_q_qwsass (9**)
    },

    {
        "id": "C christmas",
        "name": "How the Eel Stole Christmas",
        "map": [
            "*************",
            "*************",
            "*************",
            "******   ****",
            "*****0 p  ***",
            "*****     ***",
            "***  p p  ***",
            "***  2  *****",
            "***  p 0*****",
            "****   ******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,0,0,-1,-1,-1],
        "hp": 15
        // ws_w_sa (4)
        // ww_sa_saqaqqwwswss (12**)
    },
    {
        "id": "C llama",
        "name": "Llama Llama Red Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "****p   p****",
            "****12 21****",
            "**** p p ****",
            "**** 2 2 ****",
            "****0   0****",
            "****** ******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,2,0,3],
        "hp": 16
        // w__ww__qw_ssa_saaqqqqww (10)
        // w__ww__qw_ssa_saaaqwqqaqwww (12**)
    },
    {
        "id": "C go",
        "name": "Go, Eel, Go",
        "map": [
            "*************",
            "*************",
            "*************",
            "******pp*****",
            "**** 1   ****",
            "****1p1p  ***",
            "***p 1 1 0***",
            "***p p1******",
            "****   ******",
            "***** 0******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,1,-2,2,-1,2,-1,3],
        "hp": 17
        // w_ss_ww_qqaaaasswws (5)
        // w_ss_ww_ssasaqqqaaaqwqwwwws (13**)
    },
    {
        "id": "C puff",
        "name": "Puff, the Magic Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "******** 0***",
            "****  * 1 ***",
            "*** 1 1   ***",
            "*** p 0 p ***",
            "***   1 1 ***",
            "*** 1 *  ****",
            "***  ********",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [3,-1,3,0,3,1],
        "hp": 17
        // _q_wqa_qqw_qasaaq_aswsss (10)
        // _w_wqaqa_qqw_qasaaq_aswswsas (13**)
    },
    {
        "id": "C charlotte",
        "name": "Charlotte's Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "**** 0 0 ****",
            "**** p1p ****",
            "**** 131 ****",
            "****  1  ****",
            "****     ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,2,-1,2,0,2,1,2,2,2,2,1],
        "hp": 15
        // ww_sa_ss_wq_w (4)
        // _wsss_w_q_qqwwssssaaqqw (11**)
    },
    {
        "id": "C chocolate",
        "name": "Charlie and the Chocolate Eel",
        "map": [
            "*************",
            "*************",
            "****** 1 0***",
            "*****1 p  ***",
            "**** 1 1  ***",
            "***11********",
            "**   ********",
            "**1p1***pp***",
            "**   **p*****",
            "**0  **p*****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [2,-3,3,-3,3,-2,2,-2],
        "hp": 17
        // w_qqaa_qq_a_qaq_aass_wwwwswsas (9)
        // w_qqaa_sswswqqqaqaq_a_qaq_aaasws_w (13**)
    },
    {
        "id": "C velveteen",
        "name": "The Velveteen Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****0 ******",
            "***** 3 1****",
            "***0 2 2 ****",
            "*** 1 4 *****",
            "*****   *****",
            "*****p ******",
            "*****  ******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,2,0,3,-1,3],
        "hp": 14
        // wqw_qw_ss__as_ww_qasws (7)
        // wsw__qw_s__s_wqqwqaaq_qas (10**)
    },
    {
        "id": "C oz",
        "name": "The Wonderful Eel of Oz",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "*************",
            "****0   0****",
            "****1   1****",
            "****     ****",
            "****1   1****",
            "******4******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,1,0,0,0,-1],
        "hp": 15
        // qq_wsaqasssww_saaqq____a (12)
        // qq_aswwqwssss_aqas_aqq____a (15**)
    },

    {
        "id": "P poky",
        "name": "The Poky Little Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "****    0****",
            "*** 12p   ***",
            "*** 23p32 ***",
            "***   p21 ***",
            "****0    ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [1,-2,1,-1,2,-1],
        "hp": 13
        // qq__a_q___asaass__w_s___wq (7)
        // __saa_q__asaqqqqwqw_s_w___sa (9**)
    },
    {
        "id": "P james",
        "name": "James and the Giant Eel",
        "map": [
            "*************",
            "*************",
            "******0  ****",
            "*****    ****",
            "*****4 4*****",
            "*****   ***p*",
            "*****4 4*****",
            "*p***   *****",
            "*****4 4*****",
            "****0   *****",
            "****   ******",
            "*************",
            "*************"
        ],
        "eel": [0,2,0,3,0,4,-1,4,-2,4],
        "hp": 15
        // wwww____qaaaasswwww (9**)
        // wwww____qwswsaaaaqqaaaqasswws (13**)
    },
    {
        "id": "P clifford",
        "name": "Clifford the Big Red Eel",
        "map": [
            "*************",
            "*************",
            "*******  ****",
            "*****21  0***",
            "****    1  **",
            "***2 ***   **",
            "***1 *** 1***",
            "**   *** 2***",
            "**  1   p****",
            "***0  12*****",
            "****  *******",
            "*************",
            "*************"
        ],
        "eel": [3,-1,3,-2,4,-2,4,-1],
        "hp": 15
        // qaa__swwqwqq_w__qaqa__q_aas_ass_a__s (9)
        // qaa__swwwwqaqq_w__qaqa__q_aaa_aswss_a__s (13**)
    },
    {
        "id": "P sawyer",
        "name": "The Eel Of Tom Sawyer",
        "map": [
            "*************",
            "*******p*****",
            "*************",
            "*************",
            "***** 1   ***",
            "****    0 ***",
            "***01 1 1 ***",
            "***      ****",
            "***   1 *****",
            "*************",
            "*************",
            "*****p*******",
            "*************"
        ],
        "eel": [-2,2,-3,2,-3,1,-2,1],
        "hp": 12
        // swq_wsww_saaaasww_s (7)
        // sww_qqassaswwwss_aqqww (10**)
    },
    {
        "id": "P neverending",
        "name": "The Neverending Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "***** 1 0 ***",
            "****  p   ***",
            "****1 1   ***",
            "****  p1p1***",
            "***       ***",
            "***   01 ****",
            "***   *******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,1,-3,1,-3,2,-2,2,-1,2,-1,3,-2,3,-3,3],
        "hp": 16
        // wsw_ssss_aaqa_qwwwqqqwsw_s (11)
        // wsasa_sswq_ww_qqqwsw_sssaas_a (14**)
    },
    {
        "id": "P lion",
        "name": "The Lion, the Witch, and the Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "***** 0  p***",
            "****p    p***",
            "***   44 ****",
            "***0 4   ****",
            "***  4 p ****",
            "***      ****",
            "***pp********",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,2,1,2,2,2,2,1,2,0],
        "hp": 13
        // wws____wqqaa (8)
        // wws____wqwwqaaaqqass (11**)
    },
    {
        "id": "P train",
        "name": "How to Train Your Eel",
        "map": [
            "*************",
            "*************",
            "*******22****",
            "*****2222****",
            "*****22p2 ***",
            "*****p222 ***",
            "*****  22 ***",
            "*p***0 ******",
            "*p*** 0******",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [3,-2,3,-1,3,0],
        "hp": 7
        // __q__w__q__w__saaaa__qw__q__ww__qa (3)
        // __q__w__q__wsaaaa__qqqaswsw_q__w__q__ws (3*)
        // __q__w__q__wsaaaa__qw__q__aqaaswwww__q__ws (5**)
    },
    {
        "id": "P day",
        "name": "What Do Eels Do All Day",
        "map": [
            "*************",
            "*************",
            "*************",
            "********* ***",
            "******0 p ***",
            "******1   ***",
            "***  124  ***",
            "***   3******",
            "*** p 0******",
            "*** *********",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-3,0,-3,1,-3,2,-3,3],
        "hp": 14
        // sa_sw__s_ws__saqqa (7)
        // sa_sw__s_aaqwwsw____wsaa (12**)
    },

    {
        "id": "S wimpy",
        "name": "Diary of a Wimpy Eel",
        "map": [
            "*************",
            "*******p*****",
            "******* *****",
            "******* *****",
            "****p    ****",
            "***p 33    p*",
            "*** 3  3 ****",
            "***0 33  ****",
            "***   0 p****",
            "***p   p*****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,0,0,0],
        "hp": 7
        // ___wss___aqaqq___w (4)
        // ___wss___aqaaqwq___qws (7**)
    },
    {
        "id": "S bed",
        "name": "The Going-to-Bed Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "******0 *****",
            "*****  12****",
            "****21   p***",
            "***      p***",
            "***   12 ****",
            "****   0*****",
            "*****pp******",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-2,1,-3,1,-3,0],
        "hp": 9
        // swq__wssaa__swws__wq (7)
        // swq__wssss__wqwqaaaaas_w (9**)
    },
    {
        "id": "S not",
        "name": "But Not the Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "****   12****",
            "****1p   ****",
            "*****1 p  ***",
            "*****  1 0***",
            "**p**0   ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,2,0,1,0,0,0,-1,0,-2,-1,-2,-2,-2],
        "hp": 16
        // sswwwqqa_q_assswwwqqqq_a (12)
        // sswwwqqa_q_aaswssswqwwqqqq_a (16**)
    },
    {
        "id": "S everywhere",
        "name": "Everywhere Eels",
        "map": [
            "*************",
            "*************",
            "*************",
            "*************",
            "*****    ****",
            "***p0 1 1****",
            "***   pp0****",
            "***   1 1****",
            "*****    ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [-1,0,-2,0,-2,1,-3,1,-3,0],
        "hp": 13
        // wwsss_aqqqaa_ssa_sw (10)
        // wwssa_qqqasa_ssa_swww (13**)
    },
    {
        "id": "S we",
        "name": "We are in an Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****  11****",
            "****1  41****",
            "***  **  ****",
            "**0  **0 ****",
            "** 14    ****",
            "***11 p  ****",
            "*************",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,1,1,1,2,1,2,2],
        "hp": 14
        // qa_q__w_wqaaswwqws_wssw_s__a_sw (10)
        // qa_q__w_qqwsws_wswsa____sw_saaqaaqqqqa (14**)
    },
    {
        "id": "S leonardo",
        "name": "Leonardo, the Terrible Eel",
        "map": [
            "*************",
            "*************",
            "*************",
            "*****p  p****",
            "****  3 0p***",
            "***p p21  ***",
            "*** 32p   ***",
            "***  1   p***",
            "***p0    ****",
            "****p  p*****",
            "*************",
            "*************",
            "*************"
        ],
        "eel": [0,2,1,2,2,2,2,1,2,0],
        "hp": 14
        // q_wq_qw_ssassswq_w__q___w (10)
        // w_q__w___qaaswssws_wwqa__q_w (14**)
    },
    {
        "id": "S blue",
        "name": "Blue Eel, Green Hat",
        "map": [
            "*************",
            "*************",
            "*******  ****",
            "*****    ****",
            "*****1p1p  **",
            "*** 0      **",
            "*** p1p1p0***",
            "**    1 1 ***",
            "**  p p *****",
            "****    *****",
            "****  *******",
            "*************",
            "*************"
        ],
        "eel": [-1,3,-1,4,-2,4,-2,3],
        "hp": 14
        // ww_ss_w_wqq_wwssaaqqaasss (10)
        // wwqqwwssss_aa_qqwwwwssaassaaq (14**)
    },
    {
        "id": "S z",
        "name": "Z is for Eel",
        "map": [
            "*************",
            "*************",
            "******  *****",
            "******  *****",
            "*****p12*****",
            "****p   30 **",
            "**  4   4  **",
            "**  3   p****",
            "*****21p*****",
            "*****0 ******",
            "*****  ******",
            "*************",
            "*************"
        ],
        "eel": [0,0,0,1,-1,1],
        "hp": 10
        // qa_s__aqwq_wssswq_w_sa__s___a (8)
        // qa_s__aaqwwq_wssswq__wsa_ssa_q (10**)
    }
    // SOLVEREND
];

var curlevel = null;

var ROCKMAP = {
    '0011.*': ['a', 0],
    '1001.*': ['a', 1],
    '1100.*': ['a', 2],
    '0110.*': ['a', 3],
    '11110111': ['b', 0],
    '11111011': ['b', 1],
    '11111101': ['b', 2],
    '11111110': ['b', 3],
    '0111.11.': ['c', 0],
    '1011..11': ['c', 1],
    '11011..1': ['c', 2],
    '111011..': ['c', 3],
    '11111111': ['d', -1],
    '11110110': ['e', 0],
    '11110011': ['e', 1],
    '11111001': ['e', 2],
    '11111100': ['e', 3],
    '0010.*': ['f', 0],
    '0001.*': ['f', 1],
    '1000.*': ['f', 2],
    '0100.*': ['f', 3]
};

var FOODMAP = {
    '0': {type: 'starfish1', hp: 0, star: true},
    '1': {type: 'guppy1', hp: 1},
    '2': {type: 'catfish1', hp: 2},
    '3': {type: 'piranha1', hp: 3},
    '4': {type: 'stingray1', hp: 4}
};

function countstars(level) {
    var stars = 0;
    for (var x = -MR; x <= MR; x ++) {
        for (var y = -MR; y <= MR; y ++) {
            var p = level.map[MR+y][MR+x];
            var f = FOODMAP[p];
            if (f && f.star)
                stars ++;
        }
    }
    return stars;
}

function describe_level(level, num) {
    return (level.id ? level.id[0] : '') + (num+1) + (level.name ? (': "' + level.name + '"') : '');
}

function start() {
    var level = LEVELS[curlevel];
    var game = {
        map: level.map.slice(),
        eel: level.eel.slice(),
        leveldesc: describe_level(level, curlevel),
        hp: level.hp,
        over: false,
        hasstars: 0,
        stars: 0,
        food: [],
        foodhp: [],
        nonstars: 0,
        foodcount: 0,
        atstart: true
    };
    for (var x = -MR; x <= MR; x ++) {
        for (var y = -MR; y <= MR; y ++) {
            var p = level.map[MR+y][MR+x];
            var f = FOODMAP[p];
            if (f) {
                var flip = Math.random() > 0.5;
                game.food.push({
                    x: x,
                    y: y,
                    type: f.type,
                    flip: flip,
                    star: f.star
                });
                game.foodhp.push(f.hp);
                if (f.star)
                    game.hasstars ++;
                else
                    game.nonstars ++;
                game.foodcount ++;
            }
        }
    }
    return game;
}

function game_clone(game) {
    return {
        map: game.map,
        eel: game.eel.slice(),
        leveldesc: game.leveldesc,
        hp: game.hp,
        over: game.over,
        hasstars: game.hasstars,
        stars: game.stars,
        food: game.food,
        foodhp: game.foodhp.slice(),
        nonstars: game.nonstars,
        foodcount: game.foodcount,
        atstart: game.atstart
    };
}

function game_over(game) {
    if (game.hp <= 0)
        return true;
    return game.nonstars == 0;
}

function game_canmove(game, dx, dy) {
    if (game.over)
        return false;
    var eel = game.eel;
    var nx = eel[0] + dx;
    var ny = eel[1] + dy;
    for (var i = 2; i < eel.length; i += 4) {
        if (eel[i] == nx && eel[i+1] == ny)
            return false;
    }
    var what = game.map[MR+ny][MR+nx];
    if (what == '*' || what == 'p')
        return false;
    for (var i = 0; i < game.food.length; i ++) {
        var food = game.food[i];
        if (food.x == nx && food.y == ny) {
            if (game.foodhp[i] > 0)
                return false;
        }
    }
    return true;
}

function game_canshock(game) {
    return !game.over;
}

function game_move(game, dx, dy, oneat) {
    var eel = game.eel;
    var nx = eel[0] + dx;
    var ny = eel[1] + dy;
    game.hp -= MOVEHP;
    for (var i = 0; i < game.food.length; i ++) {
        var food = game.food[i];
        if (food.x == nx && food.y == ny && game.foodhp[i] == 0) {
            if (food.star) {
                game.stars ++;
            } else {
                game.nonstars --;
                game.hp = Math.min(MAXHP, game.hp + FOODHP);
            }
            game.foodcount --;
            if (oneat) oneat(food);
            game.foodhp[i] = -1;
        }
    }
    eel.splice(eel.length - 2, 2);
    eel.splice(0, 0, nx, ny);
}

function game_shock1(game, i, onshock, onharm) {
    var eel = game.eel;
    var x = eel[i];
    var y = eel[i+1];
    
    function addshock(rot, sx, sy) {
        if (onshock) onshock(rot, x, y);
        game.food.forEach(function(food, i) {
            if (food.x == sx && food.y == sy && game.foodhp[i] > 0) {
                game.foodhp[i] --;
                if (onharm) onharm(food, i);
            }
        });
    }

    var px = i > 0 && (eel[i-2] - x);
    var py = i > 0 && (eel[i-1] - y);
    var nx = i < eel.length - 2 && (eel[i+2] - x);
    var ny = i < eel.length - 2 && (eel[i+3] - y);
    var nw = px == -1 || nx == -1;
    var ne = py == -1 || ny == -1;
    var se = px == 1 || nx == 1;
    var sw = py == 1 || ny == 1;
    if (i == 0 || i == eel.length - 2) {
        if (!nw && !se) {
            addshock(-1, x - 1, y);
            addshock(1, x + 1, y);
        } else {
            addshock(0, x, y - 1);
            addshock(2, x, y + 1);
        }
    } else {
        if (!nw)
            addshock(-1, x - 1, y);
        if (!ne)
            addshock(0, x, y - 1);
        if (!se)
            addshock(1, x + 1, y);
        if (!sw)
            addshock(2, x, y + 1);
    }
}

function game_shock(game) {
    var harm = false;
    var eel = game.eel;
    game.hp = Math.max(0, game.hp - SHOCKHP);
    for (var i = 0; i < eel.length; i += 2) {
        game_shock1(game, i, null, function() { harm = true; });
    }
    return harm;
}

var solvertimer;
function cancel_solver() {
    clearTimeout(solvertimer);
}

function solver(game, callback1, callback2) {
    var PROGDUR = 2;
    var YIELDDUR = 0.5;
    var progt, yieldt;
    var solutions = [];
    var failures = [];
    var todo = [];
    var hp = 1;
    var startt = time();
    game = game_clone(game);
    game.hp = hp;

    function starthp() {
        console.info('trying hp ' + hp);
        progt = time() + PROGDUR;
        loop();
    }

    function loop() {
        while (true) {
            step();
            if (todo.length) {
                var t = time();
                if (t > yieldt) {
                    solvertimer = setTimeout(loop, 0);
                    yieldt = t + YIELDDUR;
                    return;
                }
            } else {
                nexthp();
                return;
            }
        }
    }

    function nexthp() {
        if (solutions.length) {
            console.info('done (hp ' + hp + ') in ' + (time() - startt).toFixed(3) + 's :');
            var shortest = null;
            var length = 0;
            solutions.forEach(function(sol) {
                console.info('  '+ sol);
                if (shortest == null || sol.length < length) {
                    length = sol.length;
                    shortest = sol;
                }
            });
            callback2(shortest, hp);
        } else if (hp >= MAXHP || failures.length == 0) {
            console.info('no solution');
            callback2();
        } else {
            hp ++;
            todo = failures;
            failures = []
            todo.forEach(function(t) {
                t[1].hp ++;
            });
            starthp();
        }
    }
    function step() {
        var sofar = todo[0][0];
        var game = todo[0][1];
        todo.shift();
        if (game.hp <= 0) {
            failures.push([sofar, game]);
        } else {
            var t = time();
            if (t > progt) {
                console.info('thinking: ' + sofar + ' (' + todo.length + ') (' + solutions.length + '/' + failures.length + ')');
                callback1(sofar);
                progt = time() + PROGDUR;
            }
            {
                var game2 = game_clone(game);
                if (game_shock(game2)) {
                    if (!game_over(game2))
                        todo.push([sofar + '_', game2]);
                    else if (game2.hp <= 0 && hp - game2.hp < MAXHP)
                        failures.push([sofar + '_', game2]);
                }
            }
            if (game_canmove(game, -1, 0)) {
                var game2 = game_clone(game);
                game_move(game2, -1, 0);
                if (game2.foodcount == 0)
                    solutions.push(sofar + 'q');
                else if (!game_over(game2))
                    todo.push([sofar + 'q', game2]);
                else if (game2.hp <= 0 && hp - game2.hp < MAXHP)
                    failures.push([sofar + 'q', game2]);
            }
            if (game_canmove(game, 0, -1)) {
                var game2 = game_clone(game);
                game_move(game2, 0, -1);
                if (game2.foodcount == 0)
                    solutions.push(sofar + 'w');
                else if (!game_over(game2))
                    todo.push([sofar + 'w', game2]);
                else if (game2.hp <= 0 && hp - game2.hp < MAXHP)
                    failures.push([sofar + 'w', game2]);
            }
            if (game_canmove(game, 1, 0)) {
                var game2 = game_clone(game);
                game_move(game2, 1, 0);
                if (game2.foodcount == 0)
                    solutions.push(sofar + 's');
                else if (!game_over(game2))
                    todo.push([sofar + 's', game2]);
                else if (game2.hp <= 0 && hp - game2.hp < MAXHP)
                    failures.push([sofar + 's', game2]);
            }
            if (game_canmove(game, 0, 1)) {
                var game2 = game_clone(game);
                game_move(game2, 0, 1);
                if (game2.foodcount == 0)
                    solutions.push(sofar + 'a');
                else if (!game_over(game2))
                    todo.push([sofar + 'a', game2]);
                else if (game2.hp <= 0 && hp - game2.hp < MAXHP)
                    failures.push([sofar + 'a', game2]);
            }
        }
    }
    yieldt = time() + YIELDDUR;
    todo.push(['', game]);
    starthp();
}

var cache = {};

function preloadaudio(sounds, callback) {
    var loaded = 0;
    function onload() {
        if (++loaded == sounds.length && callback)
            callback();
    }
    sounds.forEach(function(s) {
        var audio = $('<audio>')
            .on('canplaythrough', onload)
            .on('error', onload)
            .attr('id', 'audio_' + s)
            .attr('preload', 'auto');
        if (!audio[0].canPlayType) {
            onload();
            return;
        }
        $('<source>')
            .attr('src', 'audio/' + s + '.ogg')
            .attr('type', 'audio/ogg')
            .appendTo(audio);
        $('<source>')
            .attr('src', 'audio/' + s + '.m4a')
            .attr('type', 'audio/mp4')
            .appendTo(audio);
        $(document.body).append(audio);
    });
}

function preloadsvg(images, callback) {
    var loaded = 0;
    function onload() {
        if (++loaded == images.length && callback)
            callback();
    }
    images.forEach(function(image) {
        var img = new Image();
        img.onload = onload;
        img.onerror = onload;
        img.onabort = onload;
        img.src = 'svg/' + image + '.svg';
    });
};

function setimg(img, name) {
    return img.attr('src', 'svg/' + name + '.svg');
};

function mkimg(name) {
    var ret = $('<img>')
        .css('position', 'absolute');
    return setimg(ret, name);
};

var audio_on;
function play(audio) {
    if (!audio_on)
        return;
    var a = $('#audio_'+audio)[0];
    a.pause();
    setTimeout(function() {
        a.currentTime = 0;
        a.play();
    }, 0);
}

var savestate;
function load_cookie() {
    savestate = $.cookie('eelsave') || null;
    if (!savestate || savestate._v != '1')
        savestate = {_v: '1', l: {}, a: true};
    LEVELS.forEach(function(level, i) {
        if (!(level.id in savestate.l))
            savestate.l[level.id] = {
                l: i != 0,
                f: false,
                s: 0
            };
        if (DEBUG)
            savestate.l[level.id].l = false;
    });
    audio_on = savestate.a;
}

function save_cookie() {
    $.cookie('eelsavestate', savestate);
}

var page = 'intro';
var busy = true;

function goto_page(next, dir, done) {
    if (busy)
        return;
    $('#'+page).css('z-index', 0);
    $('#'+next).css('z-index', 1).removeClass('hide');
    var ease = Power3.easeInOut;
    busy = true;
    new TimelineLite()
        .to('#'+page+' > .page', 0.8, {
            'left': dir == 'left' ? 800 : -800,
            'opacity': 0,
            ease: ease
        })
        .call(function () {
            $('#'+page).addClass('hide');
            page = next;
            busy = false;
            done();
        });
    TweenLite.to('#'+next+' > .page', 0.8, {
        'left': 0,
        'opacity': 1,
        ease: ease
    });
}

var introfish = [{}, {}, {}];
function cancel_fish(fish) {
    clearTimeout(fish.timer);
    if (fish.img) {
        TweenLite.killTweensOf(fish.img);
        fish.img.remove();
    }
}
function incoming_intro() {
    introfish.forEach(cancel_fish);
}
function arrive_intro() {
    function delay_fish(fish) {
        cancel_fish(fish);
        fish.timer = setTimeout(start_fish.bind(null, fish),
                                Math.random()*3000);
    }
    function start_fish(fish) {
        cancel_fish(fish);
        if (page != 'intro')
            return;
        var type = ['guppy1', 'catfish1', 'piranha1', 'stingray1'][Math.floor(Math.random()*4)];
        fish.img = $('<img>')
            .attr('class', 'introfish')
            .attr('src', 'svg/' + type + 'a.svg')
            .attr('width', TR*2)
            .attr('height', TR*2)
            .css('opacity', 0);
        fish.y = null;
        var y;
        do {
            y = 100 + Math.random() * (BH - 200 - TR);
            introfish.forEach(function(fish) {
                if (fish.y != null && y != null && Math.abs(fish.y-y) < TR)
                    y = null;
            });
        } while (y == null);
        fish.y = y;
        fish.img.css('top', y);
        var dy = Math.random() > 0.5 ? 1 : -1;
        if (dy == 1) {
            fish.img.css('left', 0);
        } else {
            fish.img.css('left', BW - TR).css('transform', 'scaleX(-1)');
        }
        var t = 9 + Math.random()*6;
        $('#intro .page').append(fish.img);
        TweenLite.to(fish.img, t, {
            'left': dy == 1 ? (BW - TR) : 0,
            ease: Power0.easeNone
        });
        new TimelineLite()
            .to(fish.img, 1, {
                'opacity': 1
            })
            .to(fish.img, 1, {
                'opacity': 0
            }, '+=' + (t - 2))
            .call(delay_fish.bind(null, fish));
    }

    introfish.forEach(function(fish, i) {
        if (i == 0)
            start_fish(fish);
        else
            delay_fish(fish);
    });
}

function incoming_menu() {
    cancel_solver();
    [0,1,2,3,4].forEach(function(i) {
        $('#menu' + i + 'levels').empty();
    });
    LEVELS.forEach(function(level, i) {
        var stars = countstars(level);
        var container = $('#menu' + 'TGCPS'.indexOf(level.id[0]) + 'levels');
        var button = $('<span>')
            .attr('class', 'levelbutton')
            .html((i + 1) + '<br />');
        var levelsave = level.id in savestate.l ? savestate.l[level.id] : {l: true};
        button.addClass(levelsave.l ? 'l' : levelsave.f ? 'f' : 'o');
        if (!levelsave.l) {
            button.click(function() {
                if (busy)
                    return;
                curlevel = i;
                incoming_game();
                goto_page('game', 'right', arrive_game);
            });
            button.mouseenter(function() {
                $('#menuselect').text(describe_level(level, i));
            });
        } else {
            button.mouseenter(function() {
                $('#menuselect').text('(locked)');
            });
        }
        button.mouseleave(function() {
            $('#menuselect').text('');
        });
        for (var j = 0; j < stars; j ++) {
            var stardiv = $('<div>')
                .attr('class', 'levelbuttonstardiv');
            var star = $('<img>')
                .attr('class', 'levelbuttonstar')
                .attr('src', 'svg/starfish1' + (j < levelsave.s ? 'a' : 'b') + '.svg');
            stardiv.append(star);
            button.append(stardiv);
        }
        container.append(button);
    });
}
function arrive_menu() {
    clearInterval(gridlines_timer);
}

var gridlines = [];
var gridlines_timer = null;
function gridlines_update() {
    var t = time();
    gridlines.forEach(function(path) {
        var d = [];
        function curve(x1, y1, x2, y2, p1, p2) {
            d.push('M', x1, y1);
            d.push('C');
            d.push((1-GLWI)*x1 + GLWI*x2 + (y2 - y1) * p1, (1-GLWI)*y1 + GLWI*y2 - (x2 - x1) * p1);
            d.push((1-GLWI)*x2 + GLWI*x1 + (y2 - y1) * p2, (1-GLWI)*y2 + GLWI*y1 - (x2 - x1) * p2);
            d.push(x2, y2);
        }
        var z = 0;
        function roff() {
            return GLWA * perlin1(path.gridline_seed * 33.7 + (++z) * 7.7 + t);
        }
        if (path.gridline_nw)
            curve(-TR + GLG, -GLG, -GLG, -TR + GLG, roff(), roff());
        else
            curve(-TR + GLG, GLG, -GLG, TR - GLG, roff(), roff());
        path.attr('d', d.join(' '));
    });
}

function putthing(x, y, thing, rot, flip) {
    rot = rot || 0;
    var flipscale = flip ? 'scaleX(-1)' : '';
    return mkimg(thing)
        .css('left', tx(x, y)-TR)
        .css('top', ty(x, y)-TR)
        .css('width', TR*2)
        .css('height', TR*2)
        .css('transform', flipscale + ' rotate(' + (rot * 90) + 'deg)')
        .appendTo($('#board'));
}

function puteel() {
    var eel = game.eel;
    var state = game.eelstate;
    $('.eel').remove();
    var eeltype = 'eel1';
    for (var i = 0; i < eel.length; i += 2) {
        var x = eel[i];
        var y = eel[i+1];
        var px = i > 0 && (eel[i-2] - x);
        var py = i > 0 && (eel[i-1] - y);
        var nx = i < eel.length - 2 && (eel[i+2] - x);
        var ny = i < eel.length - 2 && (eel[i+3] - y);
        var nw = px == -1 || nx == -1;
        var ne = py == -1 || ny == -1;
        var se = px == 1 || nx == 1;
        var sw = py == 1 || ny == 1;
        var spec;
        if (i == 0) {
            if (nw)
                spec = ['a', 1, false];
            else if (se)
                spec = ['a', 0, true];
            else if (ne)
                spec = ['a', 1, true];
            else
                spec = ['a', 0, false];
        } else if (i == eel.length - 2) {
            if (nw)
                spec = ['f', 0, false];
            else if (se)
                spec = ['f', -1, true];
            else if (ne)
                spec = ['f', 0, true];
            else
                spec = ['f', -1, false];
        } else {
            if (nw && se)
                spec = ['b', 0, true];
            else if (nw && ne)
                spec = ['c', 0, false];
            else if (nw && sw)
                spec = ['e', 0, true];
            else if (ne && se)
                spec = ['e', 0, false];
            else if (ne && sw)
                spec = ['b', 0, false];
            else if (se && sw)
                spec = ['d', 0, false];
        }
        if (state == 'happy' && spec[0] == 'a')
            spec[0] = 'g';
        if (state == 'sad' && spec[0] == 'a')
            spec[0] = 'h';
        putthing(x, y, eeltype + spec[0], spec[1], spec[2])
            .addClass('eel');
    }
}

function canmoveeel(dx, dy) {
    return !busy && game_canmove(game, dx, dy);
}
function canshock() {
    return !busy && game_canshock(game);
}
function canrestart() {
    return !(busy || (game.atstart && !game.over));
}
function cannext() {
    return game.eelstate == 'happy' && !busy && curlevel < LEVELS.length - 1;
}
function updateconsole() {
    var nomoves = true;
    function setkey(l, b) {
        var k = $('#'+l+'key');
        setimg(k, 'console-' + l + (b ? '2' : '1'));
        k.toggleClass('active', b).toggleClass('inactive', !b);
        if (b)
            nomoves = false;
    }
    setimg($('#esckey'), 'console-esc');
    setimg($('#rkey'), 'console-r' + (canrestart() ? '2' : '1'));
    $('#restartgroup').toggleClass('active', canrestart())
        .toggleClass('inactive', !canrestart());
    setkey('q', canmoveeel(-1, 0));
    setkey('w', canmoveeel(0, -1));
    setkey('s', canmoveeel(1, 0));
    setkey('a', canmoveeel(0, 1));
    setkey('_', canshock());
    setimg($('#star1'), 'starfish1' + (game.stars > 0 ? 'a' : 'b'))
        .toggle(game.hasstars > 0);
    setimg($('#star2'), 'starfish1' + (game.stars > 1 ? 'a' : 'b'))
        .toggle(game.hasstars > 1);
    setimg($('#star3'), 'starfish1' + (game.stars > 2 ? 'a' : 'b'))
        .toggle(game.hasstars > 2);
    TweenLite.to('#hungerbar', 0.1, {
        width: Math.max(0, 25 * (MAXHP - game.hp) - 1),
        ease: Power2.easeOut
    });
    $('#hungerbar')
        .toggleClass('red', game.hp <= SHOCKHP)
        .toggleClass('yellow', game.hp > SHOCKHP && game.hp <= SHOCKHP + MOVEHP);
    if (!busy && !game.over && nomoves)
        defeat();
}
function updateaudio() {
    setimg($('#audioicon'), 'audio-' + (audio_on ? 'on' : 'off'));
}

var game;
function reset(bynext) {
    cancel_solver();
    var board = $('#board');
    if (game && game.over) {
        var x = game.eel[0];
        var y = game.eel[1];
        var x1 = BW / 2 + TR * (x - y);
        var y1 = BH / 2 + TR * (x + y);
        var t = time();
        var z = 5;
        function zoom() {
            var f = 1-Math.min(1, (time() - t)/0.5);
            var x2 = x1*(1-f) + (BW/2) * (f);
            var y2 = y1*(1-f) + (BH/2) * (f);
            $('#board').css('transform', 'translate(' + x2 + 'px,' + y2 +'px) scale(' + (1 + f*f*f*z) + ') translate(' + (-x1) + 'px,' + (-y1) + 'px)');
            if (f > 0)
                setTimeout(zoom, 10);
            else {
                game.over = false;
                updateconsole();
                if (bynext)
                    maybe_tutorial();
            }
        }
        zoom();
    } else if (bynext)
        maybe_tutorial();
    $('#victory, #defeat').hide();
    $('.gameoption').show();
    board.empty();
    game = start();
    $('.hunger, #restartgroup').toggle(curlevel > 0);
    $('#leveldesc').text(game.leveldesc);
    var gridline_svg = $(svg('svg'))
        .attr('id', 'gridlines')
        .attr('width', BW)
        .attr('height', BH)
        .appendTo(board);
    function gridline_create(x, y, nw) {
        var path = $(svg('path'))
            .attr('transform', 'translate(' + tx(x, y) + ',' + ty(x, y) + ')')
            .attr('class', 'gridline');
        path.gridline_nw = nw;
        path.gridline_seed = (x * 2 * MR + y) * 2 + (nw ? 1 : 0);
        gridline_svg.append(path);
        return path;
    }
    for (var x = -MR; x <= MR; x ++) {
        for (var y = -MR; y <= MR; y ++) {
            function passable(p) { return p != '*' && p != 'p'; }
            var p = game.map[MR+y][MR+x];
            var p0 = passable(p);
            var pnw = x > -MR && passable(game.map[MR+y][MR+x-1]);
            var psw = y < MR && passable(game.map[MR+y+1][MR+x]);
            if (p0 || pnw)
                gridlines.push(gridline_create(x, y, true));
            if (p0 || psw)
                gridlines.push(gridline_create(x, y, false));
            if (p == 'p')
                putthing(x, y, 'plant' + (1 + Math.floor(Math.random()*1)), Math.floor(Math.random()*4), Math.random() < 0.5);
        }
    }
    clearInterval(gridlines_timer);
    gridlines_timer = setInterval(gridlines_update, 100);
    game.food.forEach(function(f, i) {
        if (game.foodhp[i] < 0)
            return;
        f.creature = putthing(f.x, f.y, f.type + 'a', 0, f.flip);
        if (game.foodhp[i] > 0)
            f.number = putthing(f.x, f.y, 'number' + game.foodhp[i]);
    });
    var rocktype = 'rock1';
    for (var x = -MR-1; x <= MR+1; x ++) {
        for (var y = -MR-1; y <= MR+1; y ++) {
            if (x < -MR || x > MR || y < -MR || y > MR) {
                putthing(x, y, rocktype + 'd', Math.floor(Math.random()*4));
                continue;
            }
            var p = game.map[MR+y][MR+x];
            if (p == '*') {
                var neighbors = [];
                neighbors.push(
                    (x <= -MR || game.map[MR+y][MR+x-1] == '*') ? '1' : '0',
                    (y <= -MR || game.map[MR+y-1][MR+x] == '*') ? '1' : '0',
                    (x >= MR || game.map[MR+y][MR+x+1] == '*') ? '1' : '0',
                    (y >= MR || game.map[MR+y+1][MR+x] == '*') ? '1' : '0',
                    (x <= -MR || y <= -MR || game.map[MR+y-1][MR+x-1] == '*') ? '1' : '0',
                    (x >= MR || y <= -MR || game.map[MR+y-1][MR+x+1] == '*') ? '1' : '0',
                    (x >= MR || y >= MR || game.map[MR+y+1][MR+x+1] == '*') ? '1' : '0',
                    (x <= -MR || y >= MR || game.map[MR+y+1][MR+x-1] == '*') ? '1' : '0');
                neighbors = neighbors.join('');
                var nomatch = true;
                $.each(ROCKMAP, function(pattern, rock) {
                    if ((new RegExp('^' + pattern + '$')).test(neighbors)) {
                        var ang = rock[1];
                        if (ang == -1)
                            ang = Math.floor(Math.random()*4);
                        putthing(x, y, rocktype + rock[0], ang);
                        nomatch = false;
                    }
                });
                if (nomatch)
                    putthing(x, y, 'nomatch');
            }
        }
    }
    puteel();
    updateconsole();
}

function maybe_tutorial() {
    if (curlevel == 0)
        tutorial1();
    if (curlevel == 1)
        tutorial2();
    if (curlevel == 2)
        tutorial3();
    if (curlevel == 3)
        tutorial4();
    if (curlevel == 4)
        tutorial5();
}

var curlevel = null;
function incoming_game() {
    reset();
}
function arrive_game() {
    maybe_tutorial();
}

function moveeel(dx, dy) {
    if (!canmoveeel(dx, dy))
        return false;
    cancel_solver();
    game.atstart = false;
    var ate = false;
    var star = false;
    game_move(game, dx, dy, function(food) {
        if (food.star)
            star = true;
        food.creature.remove();
        ate = true;
    });
    if (star)
        play('star');
    else if (ate)
        play('eat');
    else
        play('move');
    if (game.nonstars == 0)
        victory();
    if (game.hp == 0)
        defeat();
    puteel();
    updateconsole();
    return true;
}

function shock() {
    if (!canshock())
        return;
    cancel_solver();
    game.atstart = false;
    var eel = game.eel;
    busy = true;
    game.hp = Math.max(0, game.hp - SHOCKHP);
    if (game.hp == 0)
        defeat();
    var i = 0;
    function next() {
        var shocks = [];
        game_shock1(game, i, function(rot, x, y) {
            play('shock');
            var thing = mkimg('shock1')
                .css('left', tx(x,y)-TR*2)
                .css('top', ty(x,y)-TR*2)
                .css('width', TR*4)
                .css('height', TR*4)
                .css('transform', 'rotate(' + (rot * 90) + 'deg)')
                .appendTo($('#board'));
            shocks.push(thing);
        }, function(food, i) {
            var hp = game.foodhp[i];
            food.number.remove();
            if (hp == 0) {
                food.creature.remove();
                food.creature = putthing(food.x, food.y, food.type + 'b', 0, food.flip);
            } else if (hp > 0) {
                food.number = putthing(food.x, food.y, 'number' + hp);
            }
        });
        updateconsole();
        setTimeout(function() {
            shocks.forEach(function(thing) {
                thing.remove();
            });
        }, 250);
        setTimeout(function() {
            i += 2;
            if (i >= eel.length) {
                busy = false;
                updateconsole();
                return;
            }
            next();
        }, 200);
    }
    next();
}

function victory() {
    var eel = game.eel;
    busy = true;
    game.over = true;
    play('victory');
    $('.gameoption').hide();
    // TODO if firefox, use spotlight instead of zoom
    // var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    var x = eel[0];
    var y = eel[1];
    var x1 = BW / 2 + TR * (x - y);
    var y1 = BH / 2 + TR * (x + y);
    var t = time();
    var z = 5;
    function zoom() {
        var f = Math.min(1, (time() - t));
        var x2 = x1*(1-f) + (BW/2) * (f);
        var y2 = y1*(1-f) + (BH/2) * (f);
        $('#board').css('transform', 'translate(' + x2 + 'px,' + y2 +'px) scale(' + (1 + f*f*f*z) + ') translate(' + (-x1) + 'px,' + (-y1) + 'px)');
        if (f < 1)
            setTimeout(zoom, 10);
        else {
            game.eelstate = 'happy';
            puteel();
            var savel = savestate.l[LEVELS[curlevel].id];
            savel.f = true;
            savel.s = Math.max(savel.s, game.stars);
            if (curlevel + 1 < LEVELS.length) {
                savel = savestate.l[LEVELS[curlevel + 1].id];
                savel.l = false;
            }
            save_cookie();
            busy = false;
            updateconsole();
            $('#victory').show();
            $('#vnextgroup').toggle(cannext());
            $('#vrestartgroup').toggle(!!game.hasstars);
        }
    }
    zoom();
}

function defeat() {
    var eel = game.eel;
    busy = true;
    game.over = true;
    play('defeat');
    $('.gameoption').hide();
    // TODO if firefox, use spotlight instead of zoom
    // var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    var x = eel[0];
    var y = eel[1];
    var x1 = BW / 2 + TR * (x - y);
    var y1 = BH / 2 + TR * (x + y);
    var t = time();
    var z = 5;
    function zoom() {
        var f = Math.min(1, (time() - t)/1.5);
        var x2 = x1*(1-f) + (BW/2) * f;
        var y2 = y1*(1-f) + (BH/2) * f;
        $('#board').css('transform', 'translate(' + x2 + 'px,' + y2 +'px) scale(' + (1 + f*f*f*z) + ') translate(' + (-x1) + 'px,' + (-y1) + 'px)');
        if (f < 1)
            setTimeout(zoom, 10);
        else {
            game.eelstate = 'sad';
            puteel();
            busy = false;
            updateconsole();
            $('#defeat').show();
        }
    }
    zoom();
}

var fadecallback;
function fadeto(x, y, r, msg, callback) {
    busy = true;
    fadecallback = null;
    var pageOffset = $('#'+page+' .page').offset();
    $('#fadeouter').removeClass('passevents');
    $('#fademsgbox').hide();
    $('#fadeouter').show();
    TweenLite.to('#fadebg', 1, {
        'opacity': 1,
        ease: Power2.easeInOut
    });
    new TimelineLite()
        .to('#fadecircle', 1, {
            attr: {
                'cx': pageOffset.left + x,
                'cy': pageOffset.top + y,
                'r': r
            },
            ease: Power2.easeInOut
        })
        .call(function() {
            $('#fademsg').html(msg);
            $('#fademsgbox')
                .css('left', x < BW/2 ? (pageOffset.left + x + r + 10) : (pageOffset.left + x - r - 10 - $('#fademsgbox').outerWidth()))
                .css('top', pageOffset.top + y - $('#fademsgbox').outerHeight()/2)
                .show();
            fadecallback = callback;
        });
}

function unfade(callback) {
    busy = true;
    fadecallback = null;
    $('#fademsgbox').hide();
    TweenLite.to('#fadebg', 1, {
        'opacity': 0,
        ease: Power2.easeInOut
    });
    new TimelineLite()
        .to('#fadecircle', 1, {
            attr: {
                'cx': $(window).width()/2,
                'cy': $(window).height()/2,
                'r': 1200
            },
            ease: Power2.easeInOut
        })
        .call(function() {
            $('#fadeouter').addClass('passevents');
            busy = false;
            if (callback)
                callback();
        });
}

function tutorial1() {
    if (savestate.t1)
        return;
    function s1() {
        var ex = game.eel[0];
        var ey = game.eel[1];
        fadeto(tx(ex, ey), ty(ex, ey), TR, 'You\'re an eel, and you\'re hungry.<br />You\'re going to have to eat all the fish.', s2);
    }
    function s2() {
        fadeto(TR + 45, BH + 35, TR, 'Use the Q, W, A and S keys to move,<br />or click on the next place you want to go.', s3);
    }
    function s3() {
        fadeto(tx(1,-1), ty(1,-1), TR, 'You have to kill the fish before you eat it.', s4);
    }
    function s4() {
        fadeto(TR + 45, BH + 87, TR, 'Your electric shock attack can kill fish.<br />Press space to use it, or click on your head.', d);
    }
    function d() {
        savestate.t1 = true;
        save_cookie();
        unfade();
    }
    s1();
}

function tutorial2() {
    if (savestate.t2)
        return;
    function s1() {
        fadeto(tx(-1, 1), ty(-1, 1), TR, 'It takes 2 shocks to kill this fish.', s2);
    }
    function s2() {
        fadeto(BW - TR - 520 + 5 + 25 * (MAXHP - game.hp) + 3, BH + 30 + 14 + 10, 25, 'This is how hungry you are.<br />Each move or shock makes you hungrier.', s3);
    }
    function s3() {
        fadeto(BW - TR - 520 + 5 + 25 * MAXHP + 3, BH + 30 + 14 + 10, 25, 'If you get too hungry, you\'ll starve.', d);
    }
    function d() {
        savestate.t2 = true;
        save_cookie();
        unfade();
    }
    s1();
}

function tutorial3() {
    if (savestate.t3)
        return;
    function s1() {
        fadeto(tx(0, 0), ty(0, 0), TR, 'This fish will take 3 shocks to kill,<br />but you\'re too hungry for that.', s2);
    }
    function s2() {
        fadeto(tx(-0.5, 0.5), ty(-0.5, 0.5), TR*2, 'Try shocking it from two sides at once.', d);
    }
    function d() {
        savestate.t3 = true;
        save_cookie();
        unfade();
    }
    s1();
}

function tutorial4() {
    if (savestate.t4)
        return;
    function s1() {
        fadeto(tx(0, 0), ty(0, 0), TR*2, 'You can kill both of these fish at the same time<br />with just one shock.', d);
    }
    function d() {
        savestate.t4 = true;
        save_cookie();
        unfade();
    }
    s1();
}
 
function tutorial5() {
    if (savestate.t5)
        return;
    function s1() {
        fadeto(tx(-2, 0.5), ty(-2, 0.5), TR*1.5, 'If you eat the last fish, you beat the level.', s2);
    }
    function s2() {
        fadeto(tx(1, 2), ty(1, 2), TR, 'But for an extra challenge,<br />try to collect the starfish along the way.', d);
    }
    function d() {
        savestate.t5 = true;
        save_cookie();
        unfade();
    }
    s1();
}

function drawsol(sol) {
    $('#solsvg').remove();
    if (!sol) return;
    var solsvg = $(svg('svg'))
        .attr('id', 'solsvg')
        .css('position', 'absolute')
        .css('width', BW)
        .css('height', BH)
        .appendTo($('#board'));
    var ex = game.eel[0];
    var ey = game.eel[1];
    var x = tx(ex, ey);
    var y = ty(ex, ey) - 20;
    for (var i = 0; i < sol.length; i ++) {
        var col = Math.floor(i * 255 / sol.length);
        col = 'rgb('+col+','+col+','+col+')';
        var nx = x, ny = y;
        if (sol[i] == 'q') {
            nx -= TR; ny -= TR;
        } else if (sol[i] == 'w') {
            nx += TR; ny -= TR;
        } else if (sol[i] == 's') {
            nx += TR; ny += TR;
        } else if (sol[i] == 'a') {
            nx -= TR; ny += TR;
        } else if (sol[i] == '_') {
            var c = $(svg('circle'))
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 15)
                .attr('class', 'sol')
                .css('stroke', col);
            solsvg.append(c);
            continue;
        }
        ny += 40/sol.length;
        var l = $(svg('line'))
            .attr('x1', x)
            .attr('y1', y)
            .attr('x2', nx)
            .attr('y2', ny)
            .attr('class', 'sol')
            .css('stroke', col);
        solsvg.append(l);
        x = nx;
        y = ny;
    }
}

function do_q(event) {
    moveeel(-1, 0);
}
function do_w(event) {
    moveeel(0, -1);
}
function do_s(event) {
    moveeel(1, 0);
}
function do_a(event) {
    moveeel(0, 1);
}
function do__(event) {
    shock();
}
function do_restart(event) {
    if (canrestart())
        reset();
}
function do_next(event) {
    if (cannext()) {
        curlevel ++;
        reset(true);
    }
}
function do_audio() {
    audio_on = !audio_on;
    updateaudio();
}
function do_back() {
    if (busy)
        return;
    if (page == 'game') {
        incoming_menu();
        goto_page('menu', 'left', arrive_menu);
    } else if (page == 'menu') {
        incoming_intro();
        goto_page('intro', 'left', arrive_intro);
    }
}
function do_play() {
    if (busy)
        return;
    if (page == 'intro') {
        incoming_menu();
        goto_page('menu', 'right', arrive_menu);
    }
}

var hackk = 0;
var hack = false;
var mouseX, mouseY;
var boardX, boardY;
function game_mousemove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;
    var boardOffset = $('#board').offset();
    var mx = (mouseX - boardOffset.left - BW/2) / TR;
    var my = (mouseY - boardOffset.top - BH/2) / TR;
    var x = Math.round(mx/2 + my/2);
    var y = Math.round(my/2 - mx/2);
    if (x >= -MR && x <= MR && y >= -MR && y <= MR) {
        boardX = x;
        boardY = y;
        if (!hack) {
            var eel = game.eel;
            var lx = boardX - eel[0];
            var ly = boardY - eel[1];
            if (Math.abs(lx) + Math.abs(ly) == 1 && canmoveeel(lx, ly))
                $('#window').css('cursor', 'pointer');
            else if (lx == 0 && ly == 0 && canshock())
                $('#window').css('cursor', 'pointer');
            else
                $('#window').css('cursor', 'default');
        } else
            $('#window').css('cursor', 'default');
    } else
        boardX = boardY = null;
}
function window_click(event) {
    if (busy)
        return;
    if (hack)
        return;
    var eel = game.eel;
    if (boardX != null) {
        var lx = boardX - eel[0];
        var ly = boardY - eel[1];
        if (Math.abs(lx) + Math.abs(ly) == 1) {
            if (lx == -1)
                do_q();
            else if (ly == -1)
                do_w();
            else if (lx == 1)
                do_s();
            else if (ly == 1)
                do_a();
        } else if (lx == 0 && ly == 0)
            do__();
    }
}
function document_keyup(event) {
    if (fadecallback)
        fadecallback();
    if (busy)
        return;
    var keyCode = event.keyCode || event.charCode;
    if (keyCode == 27)
        do_back();
    else if (keyCode == 109 || keyCode == 77)
        do_audio();
    if (page == 'game') {
        if (keyCode == 114 || keyCode == 82)
            do_restart();
        else if (keyCode == 110 || keyCode == 78)
            do_next();
    }
}
function document_keypress(event) {
    if (busy)
        return;
    var keyCode = event.keyCode || event.charCode;
    if (page == 'game') {
        var eel = game.eel;
        if (DEBUG && '[][]'[hackk].charCodeAt(0) == keyCode) {
            hackk ++
            if (hackk == 4) {
                hack = !hack;
                $('body').css('background', hack ? 'grey' : '');
                hackk = 0;
                if (!hack) {
                    console.info(JSON.stringify(LEVELS[curlevel], 0, 2));
                }
            }
        } else 
            hackk = 0;
        if (hack) {
            if (boardX != null) {
                var tile = LEVELS[curlevel].map[MR+boardY][MR+boardX];
                function settile(c) {
                    var s = LEVELS[curlevel].map[MR+boardY];
                    LEVELS[curlevel].map[MR+boardY] = s.substr(0, MR+boardX) + c + s.substr(MR+boardX+1);
                }
                if (keyCode == 32) {
                    settile(' ');
                } else if (keyCode == 49) {
                    settile('1');
                } else if (keyCode == 50) {
                    settile('2');
                } else if (keyCode == 51) {
                    settile('3');
                } else if (keyCode == 52) {
                    settile('4');
                } else if (keyCode == 112) {
                    settile('p');
                } else if (keyCode == 48) {
                    settile('0');
                } else if (keyCode == 114) {
                    settile('*');
                } else if (keyCode == 101) {
                    LEVELS[curlevel].eel = [boardX, boardY];
                } else if (keyCode == 108) {
                    var lx = Math.abs(boardX - eel[eel.length-2]);
                    var ly = Math.abs(boardY - eel[eel.length-1]);
                    if (lx + ly == 1)
                        LEVELS[curlevel].eel.push(boardX, boardY);
                    else if (lx + ly == 0)
                        LEVELS[curlevel].eel.splice(eel.length-2, 2);
                } else if (keyCode == 42) {
                    solver(start(), drawsol, function(sol, hp) {
                        if (sol == null)
                            return;
                        LEVELS[curlevel].hp = hp;
                        reset();
                        drawsol(sol);
                    });
                    return;
                }
                reset();
            }
        } else {
            if (keyCode == 113 || keyCode == 81)
                do_q();
            else if (keyCode == 119 || keyCode == 87)
                do_w();
            else if (keyCode == 115 || keyCode == 83)
                do_s();
            else if (keyCode == 97 || keyCode == 65)
                do_a();
            else if (keyCode == 32)
                do__();
            else if (DEBUG && keyCode == 43) {
                curlevel ++; reset();
            } else if (DEBUG && keyCode == 45) {
                curlevel --; reset();
            } else if (DEBUG && keyCode == 42) {
                solver(game, drawsol, drawsol);
            }
        }
        updateconsole();
    } else if (page == 'intro') {
        if (keyCode == 32 || keyCode == 13) {
            do_play();
        }
    } else if (page == 'menu') {
    }
}
function hunger_click(event) {
    if (hack) {
        var offset = $('#hunger2').offset();
        var x = Math.round((event.pageX - offset.left - 5) / 25);
        LEVELS[curlevel].hp = MAXHP - x;
        reset();
    }
}

function loaded() {
    busy = false;
    $(document)
        .keyup(document_keyup)
        .keypress(document_keypress)
        .click(function(event) {
            if (fadecallback)
                fadecallback();
        });
    $('#introplay > a').click(do_play);
    $('#menuback > a, #quitgroup, #vquitgroup, #dquitgroup').click(do_back);
    $('#restartgroup, #vrestartgroup, #drestartgroup').click(do_restart);
    $('#vnextgroup').click(do_next);
    $('#game .page').mousemove(game_mousemove);
    $('#window').click(window_click);
    ['q', 'w', 'a', 's', '_'].forEach(function(k) {
        $('#'+k+'key').click(window['do_'+k]);
    });
    setimg($('#hunger1'), 'hunger1');
    setimg($('#hunger2'), 'hunger2');
    setimg($('#mkey'), 'console-m');
    setimg($('#vnkey'), 'console-n');
    setimg($('#vrkey, #drkey'), 'console-r2');
    setimg($('#vesckey, #desckey'), 'console-esc');
    $('#hunger2').click(hunger_click);
    $('#audiooverlay').show();
    $('#audiogroup').click(do_audio);
    updateaudio();
    $('#fadecircle')
        .attr('cx', $(window).width()/2)
        .attr('cy', $(window).height()/2);
    
    $('#window, #board_outer')
        .css('width', BW-2)
        .css('height', BH-2)
        .css('left', 1)
        .css('top', 1);
    $('#border')
        .css('width', BW)
        .css('height', BH);
    $('#console')
        .css('width', BW)
        .css('top', BH);
    $('#border').attr('src', 'svg/border1.svg');
}

$(document).ready(function() {
    $(document).on('dragstart', function(e) { e.preventDefault(); });
    load_cookie();
    $('#menu > .page, #game > .page').css({
        'left': 800,
        'opacity': 0
    });
    var food = ['starfish1', 'guppy1', 'catfish1', 'piranha1', 'stingray1'];
    var imgs = [];
    food.forEach(function(food) {
        imgs.push(food + 'a');
    });
    preloadsvg(imgs, function() {
        imgs = [];
        imgs.push('border1', 'hunger1', 'hunger2', 'plant1', 'shock1', 'console-esc', 'console-n', 'console-m', 'audio-on', 'audio-off');
        food.forEach(function(food) {
            imgs.push(food + 'a', food + 'b');
        });
        ['q', 'w', 'a', 's', '_', 'r'].forEach(function(key) {
            imgs.push('console-' + key + '1', 'console-' + key + '2');
        });
        ['eel1'].forEach(function(eel) {
            ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function(l) {
                imgs.push(eel + l);
            });
        });
        ['rock1'].forEach(function(rock) {
            ['a', 'b', 'c', 'd', 'e', 'f'].forEach(function(l) {
                imgs.push(rock + l);
            });
        });
        ['1', '2', '3', '4'].forEach(function(n) {
            imgs.push('number' + n);
        });
        TweenLite.to('#introstar', 1, {
            'opacity': 1,
            ease: Power0.easeNone
        });
        arrive_intro();
        preloadsvg(imgs, function() {
            var sounds = ['drop', 'move','shock', 'eat', 'star', 'victory', 'defeat'];
            preloadaudio(sounds, function() {
                loaded();
                TweenLite.to($('#introplay').show(), 1, {
                    'opacity': 1,
                    ease: Power0.easeNone
                });
            });
        });
    });
});
