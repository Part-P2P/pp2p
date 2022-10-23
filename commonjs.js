var CommonJS = {
    TabSwitch: function() {
        //Gets if the page is currently shown or not. the example here is to always run the code.
        /*document.addEventListener("visibilitychange", function() {
            if (document.hidden){
                return true;
            } else {
                return false;
            }
        });*/
        if (document.hidden){
            return true;
        } else {
            return false;
        }
    },
    params: function(action, parameter, defaultvalue) {
        //Gets/Deletes page parameter. parameter must be defined.
        if (defaultvalue == null || defaultvalue.length < 1) defaultvalue = 0;
        if (parameter == null || parameter.length < 1) return 'failed';
        if (action == 'get' || action == 'obtain') {
            var urlparameter = defaultvalue;
            if(window.location.href.indexOf(parameter) > -1){
                urlparameter = CommonJS.getUrlVars()[parameter];
            }
            return urlparameter;
        } else if (action == 'del' || action == 'delete') {
            var url=document.location.href;
            var urlparts= url.split('?');
          
           if (urlparts.length>=2)
           {
            var urlBase=urlparts.shift(); 
            var queryString=urlparts.join("?"); 
          
            var prefix = encodeURIComponent(parameter)+'=';
            var pars = queryString.split(/[&;]/g);
            for (var i= pars.length; i-->0;)               
                if (pars[i].lastIndexOf(prefix, 0)!==-1)   
                    pars.splice(i, 1);
            url = urlBase+'?'+pars.join('&');
            window.history.pushState('',document.title,url); // added this line to push the new url directly to url bar .
          
          }
          return url;
        }
        return 'failed';
    },
    getUrlVars: function() {
        //params helper, do not use.
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    },
    random: function(length, type, casetype) {
        //LENGTH = how much will the string be long;
        //TYPE = num / str / both; (Generate numbers or strings or both)
        //CASETYPE = upr / lwr / both; (Generated letters on uppercase or lowercase or both)
        //Default = '5', 'both', 'both';
        length = length ?? 5;
        if (isNaN(length)) length = 5;
        type = type ?? 'both';
        casetype = casetype ?? 'both';
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        if (type == 'num') {
            characters = '0123456789';
        } else if (type == 'str' && casetype == 'upr') {
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        } else if (type == 'str' && casetype == 'lwr') {
            characters = 'abcdefghijklmnopqrstuvwxyz';
        } else if (type == 'str' && casetype == 'both') {
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        } else if (type == 'both' && casetype == 'upr') {
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        } else if (type == 'both' && casetype == 'lwr') {
            characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        }
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    encrypt: function(text, pass) {
        //CRYPTJS MUST BE LINKED!!!
        //<script src="https://xcenter.netlify.app/assets/js/crypto.js" defer></script>
        if (text == null || text.length < 1 || pass == null || pass.length < 1) return;
        var encrypted = CryptoJS.AES.encrypt(text, pass);
        return encrypted
    },
    decrypt: function(text, pass) {
        //CRYPTJS MUST BE LINKED!!!
        //<script src="https://xcenter.netlify.app/assets/js/crypto.js" defer></script>
        if (text == null || text.length < 1 || pass == null || pass.length < 1) return;
        var decryptedtmp = CryptoJS.AES.decrypt(text, pass);
        var decrypted = decryptedtmp.toString(CryptoJS.enc.Utf8);
        return decrypted;
    },
    stringSimiliarity: function(string1, string2) {
        function similarity(s1, s2) {
            var longer = s1;
            var shorter = s2;
            if (s1.length < s2.length) {
              longer = s2;
              shorter = s1;
            }
            var longerLength = longer.length;
            if (longerLength == 0) {
              return 1.0;
            }
            return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
        }
        function editDistance(s1, s2) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();
          
            var costs = new Array();
            for (var i = 0; i <= s1.length; i++) {
              var lastValue = i;
              for (var j = 0; j <= s2.length; j++) {
                if (i == 0)
                  costs[j] = j;
                else {
                  if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                      newValue = Math.min(Math.min(newValue, lastValue),
                        costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                  }
                }
              }
              if (i > 0)
                costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        }
        return similarity(string1, string2);
    },
    mix: function(txt1, txt2) {
        //EXAMPLE: CommonJS.mix("ACEFH","BD GI") >> ABCDE FGHI
        var m = (a, b) => a.length ? [a[0], ...m(b, a.slice(1))] : b;
        var mix = m(txt1, txt2);
        return mix.join('');
    },
    compressString: function(c) {var x='charCodeAt',b,e={},f=c.split(""),d=[],a=f[0],g=256;for(b=1;b<f.length;b++)c=f[b],null!=e[a+c]?a+=c:(d.push(1<a.length?e[a]:a[x](0)),e[a+c]=g,g++,a=c);d.push(1<a.length?e[a]:a[x](0));for(b=0;b<d.length;b++)d[b]=String.fromCharCode(d[b]);return d.join("")},
    decompressString: function(b) {var a,e={},d=b.split(""),c=f=d[0],g=[c],h=o=256;for(b=1;b<d.length;b++)a=d[b].charCodeAt(0),a=h>a?d[b]:e[a]?e[a]:f+c,g.push(a),c=a.charAt(0),e[o]=f+c,o++,f=a;return g.join("")},
    convertImgBase64: function(img) {
        if (img == null || img.length < 1) return false;
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    },
    replaceBackHistoryButton: function(newURL) {
        (function(window, location) {
            history.replaceState(null, document.title, location.pathname+"#!/stealingyourhistory");
            history.pushState(null, document.title, location.pathname);
        
            window.addEventListener("popstate", function() {
              if(location.hash === "#!/stealingyourhistory") {
                    history.replaceState(null, document.title, location.pathname);
                    setTimeout(function(){
                      location.replace(newURL);
                    },0);
              }
            }, false);
        }(window, location));
    },
    makeEvent: function(target, name, data) {
        target = target ?? document;
        data = data ?? {};
        if (name == null || name.length < 1) return;
        var event = new CustomEvent(name, data);
        target.dispatchEvent(event);
    },
}
