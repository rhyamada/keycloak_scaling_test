cat <<EOF > /usr/local/etc/haproxy/haproxy.cfg
global
  ssl-default-bind-ciphers TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
  ssl-default-bind-options ssl-min-ver TLSv1.2
  tune.ssl.default-dh-param 2048

defaults
  mode http
  timeout connect 60s
  timeout client 60s
  timeout server 60s
  timeout http-request 60s
  timeout check 20s

frontend http-in 
  bind *:80
  default_backend keycloak

backend keycloak
  option httpchk GET /auth/realms/master
  http-check expect status 200
  default-server inter 5s  
EOF

getent hosts keycloak | awk '{print "  server " $1 " " $1":8080 check cookie " $1}' >> /usr/local/etc/haproxy/haproxy.cfg

kill -s SIGHUP 1

#d exec ingress bash /usr/local/etc/haproxy/reload.sh