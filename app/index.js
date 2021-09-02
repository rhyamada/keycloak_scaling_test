const needle = require('needle');
const client_id = 'client_id';
const client_secret = '**********';
const redirect_uri = 'https://keycloak.localhost/callback';
const grant_type = 'authorization_code';

const token_endpoint = 'http://ingress/auth/realms/example/protocol/openid-connect/token';
const auth_endpoint = 'http://ingress/auth/realms/example/protocol/openid-connect/auth?client_id=client_id&response_type=code&scope=openid&redirect_uri=' + redirect_uri;

let count = 0, N = 0, J = 0;
let T = [];
let start = new Date().getTime();
function time() { return new Date().getTime(); }
function cb(f, a, b) { setTimeout(f, J * 100 * Math.random(), a, b); }
function token(code) {
    let begin = time();
    needle.post(token_endpoint, { grant_type, client_id, client_secret, code, redirect_uri }, (err, res) => {
        T.push(time() - begin);
        N--;
        if (err) {
            console.log("ERRO:" + err); return;
        }
        if (res.statusCode != 200) {
            console.log("ERRO:" + res.statusCode); return;
        }
        count++;
    });
}

function form(url, Cookie) {
    let username = 'user' + Math.floor(Math.random() * 1000);
    let data = 'username=' + username + '&password=password';
    let begin = time();
    needle.post(url, data, { headers: { Cookie } }, (err, res) => {
        T.push(time() - begin);
        if (err) {
            N--;
            console.log("ERRO:" + err); return;
        }
        if (res.statusCode != 302) {
            N--;
            console.log("ERRO:" + res.statusCode); return;
        }
        let location = res.headers['location'];
        let a = location.indexOf('code=');
        let code = location.substring(a + 5);
        cb(token, code);
    });
}

function auth(url) {
    let begin = time();
    needle.get(url, (err, res) => {
        T.push(time() - begin);
        if (err) {
            N--;
            console.log("ERRO:" + err); return;
        }
        if (res.statusCode != 200) {
            N--;
            console.log("ERRO:" + res.statusCode); return;
        }
        let a = res.body.indexOf('action');
        let b = res.body.indexOf('"', a + 200);
        let url = res.body.substring(a + 8, b).replaceAll('&amp;', '&');
        let cookie = res.headers['set-cookie'].map((i) => { return i.split(';', 2)[0]; }).join('; ');
        cb(form, url, cookie);
    });
}

function timer() {
    let now = time();
    if (T.length > 0) {
        let rate = Math.round(count * 1000 / (now - start));
        count=0;
        T.sort();
        let avg = Math.round(T.reduce((a,b)=>(a+b))/T.length);
        let p90 = T[Math.floor(T.length*0.9)];
        T = [];
        start = now;
        console.log(rate +' / '+J+' login/s  '+N+' threads  avg:'+avg+' ms  p90:'+p90+' ms');
    }
    if (J < 90) {
        J+=5;
    }
    for (let i = 0; i < J; i++) {
        N++;
        cb(auth, auth_endpoint);
    }
}

setInterval(timer, 1000);