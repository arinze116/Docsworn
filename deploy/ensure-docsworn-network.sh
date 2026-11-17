#!/bin/sh
set -eu

NETWORK_NAME="docsworn-audit"
NETWORK_SUBNET="172.30.20.0/24"
HOST_PUBLIC_IP="145.241.165.116/32"

if ! /usr/bin/docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  /usr/bin/docker network create --driver bridge --subnet "$NETWORK_SUBNET" "$NETWORK_NAME" >/dev/null
fi

add_reject_rule() {
  destination="$1"
  if ! /usr/sbin/iptables -C DOCKER-USER -s "$NETWORK_SUBNET" -d "$destination" -j REJECT >/dev/null 2>&1; then
    /usr/sbin/iptables -I DOCKER-USER 1 -s "$NETWORK_SUBNET" -d "$destination" -j REJECT
  fi
}

add_reject_rule "0.0.0.0/8"
add_reject_rule "10.0.0.0/8"
add_reject_rule "100.64.0.0/10"
add_reject_rule "127.0.0.0/8"
add_reject_rule "169.254.0.0/16"
add_reject_rule "172.16.0.0/12"
add_reject_rule "192.168.0.0/16"
add_reject_rule "224.0.0.0/4"
add_reject_rule "$HOST_PUBLIC_IP"
