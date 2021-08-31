const needle = require('needle');
const client_id = 'client_id';
const client_secret = '**********';
const redirect_uri = 'https://keycloak.localhost/callback';
const grant_type = 'authorization_code';

const token_endpoint = 'http://ingress/auth/realms/example/protocol/openid-connect/token';
const auth_endpoint = 'http://ingress/auth/realms/example/protocol/openid-connect/auth?client_id=client_id&response_type=code&scope=openid&redirect_uri=' + redirect_uri;

let count = 0;
let start = new Date().getTime();
let next = 0;
let N = 0;
let R = 0;
let T = 0;
function time(){return new Date().getTime();}
function cb(f,a,b){setTimeout(f,20000*Math.random(),a,b);}
function token(code) {
    let begin = time();
    needle.post(token_endpoint, { grant_type, client_id, client_secret, code, redirect_uri }, (err, res) => {
        T += time()-begin;
        R ++;
        N--;
        if (err) {
            console.log("ERRO:" + err); return;
        }
        if (res.statusCode != 200) {
            console.log("ERRO:" + res.statusCode); return;
        }
        count ++;
        let now = time();
        if(now>next){
            let t = T/R;
            console.log(N, count*1000/(now-start), T/R);
            count = 0;
            T = 0; R=0;
            next = now+5000;
            start = now;
        }
    });
}

function form(url, Cookie) {
    let username = 'user'+Math.floor(Math.random()*1000);
    let data = 'username='+username+'&password=password';
    let begin = time();
    needle.post(url, data, { headers: { Cookie } }, (err, res) => {
        T += time()-begin;
        R ++;
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
        cb(token,code);
    });
}

function auth(url) {
    let begin = time();
    needle.get(url, (err, res) => {
        T += time()-begin;
        R ++;
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
        cb(form,url,cookie);
    });
}

let J = 1;
function timer(){
    if(J<90){J++;}
    for(let i=0; i < J; i++){
        N++;
        cb(auth,auth_endpoint);
    }
}

setInterval(timer,1000);
