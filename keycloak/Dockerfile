FROM jboss/keycloak:9.0.3
RUN /opt/jboss/keycloak/bin/add-user.sh -u serpro -p serpro
HEALTHCHECK CMD curl --fail http://localhost:8080/auth/realms/master || exit 1