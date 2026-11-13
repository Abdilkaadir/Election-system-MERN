# Installing the Election System on a New Windows Computer

This guide is for someone setting up the Zamzam University Election System on a computer that does not have the software installed. You do not need to know how to program, but you will need an internet connection and permission to install applications.

The steps below install the system for use on that computer. Choose **Local MongoDB** or **MongoDB Atlas** as the database. Atlas stores the data online; Local MongoDB stores it on this computer.

> **Existing election data:** A fresh setup starts with an empty database. Copying the project folder does not copy existing elections, users, ballots, or uploaded candidate photos. If you need to keep existing data, see [Moving existing data](#moving-existing-data-from-another-computer) before starting.

## 1. Copy the project to the new computer

Copy the complete `Election` project folder to the new computer, for example to `Documents\Election`. The folder should contain `package.json`, `package-lock.json`, `client`, and `server`.

You do not need to copy any `node_modules` folders. They contain installed software packages and will be recreated during setup. Do not send `server/.env` through a public website or include it in a public code repository; it contains private connection information.

## 2. Install Node.js

Node.js runs the website and its API. Download the current **LTS** Windows installer from the [official Node.js download page](https://nodejs.org/en/download/). Choose the Windows installer that matches the computer (usually Windows x64), open the downloaded file, and accept the normal installation options. The official Node.js page recommends the Windows Installer (`.msi`) for Windows.

After installation, open **PowerShell** and check that Node.js and npm are available:

```powershell
node --version
npm --version
```

Both commands should print a version number. If PowerShell says a command is not recognized, close PowerShell, open it again, and retry. If that still fails, restart Windows and try again.

## 3. Set up a database

Choose one of the following options. You only need one database. If the organization already has an Atlas cluster, use that Atlas cluster rather than creating another one.

### Option A: Local MongoDB

Local MongoDB keeps the election data on this computer. This is a good choice for a standalone installation that will be managed from this computer.

1. Download **MongoDB Community Server** from the [official MongoDB download page](https://www.mongodb.com/try/download/community).
2. Select Windows and the Windows Installer (`.msi`), then install it using the normal options. In the installer, keep **Install MongoD as a Service** selected so MongoDB starts with Windows. MongoDB's [Windows installation guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/) describes this service setup.
3. Optionally install [MongoDB Compass](https://www.mongodb.com/try/download/compass) if you want a graphical tool to view the database. Compass is optional; the election system does not require it.
4. Open PowerShell and check the standard local MongoDB port:

   ```powershell
   Test-NetConnection 127.0.0.1 -Port 27017
   ```

   Continue when the result says `TcpTestSucceeded : True`. If it says `False`, MongoDB has not started. Open Windows **Services**, find the MongoDB service, and start it. MongoDB's Windows guide says the service normally starts after installation and listens on port `27017`.

The application will use this database address:

```text
mongodb://127.0.0.1:27017/Election-system
```

The `Election-system` database is created automatically when the application first saves data.

### Option B: MongoDB Atlas

Atlas stores the election data in MongoDB's cloud service. You need an Atlas account and an active cluster. You do **not** need to install MongoDB Community Server for this option. Compass is optional.

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/) and open the project that contains the cluster.
2. Confirm the cluster is active.
3. In **Security > Network Access**, add the new computer's current public IP address to the project's IP Access List. Atlas only accepts connections from addresses on this list. When the computer changes networks or its public IP changes, update the list.
4. In **Security > Database Access**, create or choose a **database user** and note its password. This is not the same as the Atlas website account. The user needs permission to read and write the application's database.
5. In the cluster's **Connect** dialog, choose **Drivers**, choose Node.js, and copy the connection string. Replace the password placeholder with the database user's password. Make sure the database part of the address is `Election-system` (the part after the cluster host and before `?`). If the password contains special characters, encode them for a connection string; Atlas explains this in its [driver connection guide](https://www.mongodb.com/docs/atlas/driver-connection/).

Keep the Atlas connection string private. Do not paste it into a public document, chat, or source repository.

## 4. Create the private configuration file

The application needs a file named `.env` inside the `server` folder. This file is excluded from the project copy/repository because it contains secrets.

1. Open the `Election` folder in File Explorer, then open its `server` folder.
2. In Notepad, choose **File > Save As**. Enter `.env` as the file name, set **Save as type** to **All files**, then save it in the `server` folder. Make sure Windows has not named it `.env.txt`. In File Explorer, turn on **View > Show > File name extensions** if you cannot see the full filename.
3. Open `.env` in Notepad and enter the settings for the database option you chose below.

For **Local MongoDB**, use:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET
MONGO_URI_DEV=mongodb://127.0.0.1:27017/Election-system
```

For **MongoDB Atlas**, use:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET
MONGO_URI_PRO=PASTE_YOUR_ATLAS_CONNECTION_STRING_HERE
```

Replace the JWT placeholder with a random secret at least 32 characters long. You can generate one in PowerShell with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `JWT_SECRET`. For Atlas, replace the entire `MONGO_URI_PRO` placeholder with the connection string from Atlas. Do not include extra quotes around these values. Save the file. Keep it private and do not share it publicly.

The project uses `NODE_ENV` to choose the database: `development` selects `MONGO_URI_DEV`; `production` selects `MONGO_URI_PRO`. The Atlas database user in the Atlas connection string is separate from the admin account you will use to sign in to the election website.

## 5. Install the application packages

Open PowerShell in the main `Election` folder. An easy way is to open that folder in File Explorer, click the address bar, type `powershell`, and press Enter. Check that the prompt ends in the `Election` folder, then run these commands one at a time:

```powershell
npm install
npm --prefix client install
npm --prefix server install
```

Wait for each command to finish. Warnings about optional packages are usually okay; a line beginning with `npm ERR!` means installation failed.

## 6. Create the first website administrator

Create an administrator account once, after the database is configured and reachable. In the same PowerShell window, still in the main `Election` folder, run:

```powershell
npm --prefix server run create-admin -- admin 'Choose-A-Strong-Password' 'Administrator Name'
```

Replace `Choose-A-Strong-Password` with the password the administrator will use to sign in. Replace `Administrator Name` with the administrator's real display name. Keep the single quotes around the password and name. The command writes the user to whichever database is selected by `NODE_ENV` in `server/.env`.

If you switch from Local MongoDB to Atlas later, the account does not move with the setting. Run this command again while `NODE_ENV=production` to create an administrator in Atlas. If the selected database already has that username, do not run the command again; it will report that the username already exists.

## 7. Start and open the system

From the main `Election` folder, run:

```powershell
npm run dev
```

Keep this PowerShell window open while using the system. When setup is successful, the terminal should show messages similar to:

```text
MongoDB connected (development) (Election-system).
Election API listening on port 5000.
```

For Atlas, the first message will say `production` instead of `development`.

Open a browser on the same computer and visit:

```text
http://localhost:5173
```

Sign in with the administrator username and password created in step 6. To stop the system, return to PowerShell and press **Ctrl+C**.

## Common problems

### The terminal says `ECONNREFUSED 127.0.0.1:27017`

This is the Local MongoDB option. MongoDB is not running on the expected local port. Start the MongoDB Windows service, then check again with:

```powershell
Test-NetConnection 127.0.0.1 -Port 27017
```

### The terminal says it cannot connect to MongoDB Atlas

Check that the Atlas cluster is active, that the current public IP is in **Security > Network Access**, and that the Atlas database username/password in `MONGO_URI_PRO` are correct. A firewall, VPN, or office network can block outbound MongoDB connections on port `27017`. Atlas connection requirements are described in its [connection troubleshooting guide](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).

### The browser says it could not sign in, or PowerShell shows a Vite proxy error

Look at the same PowerShell window for an earlier `[dev:server]` error. The browser cannot sign in while the API server is stopped. Fix the server/database error first. If the terminal says MongoDB connected but the username is not found, create the administrator account in the selected database using step 6.

### The terminal says the username already exists

That admin account is already in the selected database. Use its existing password. If nobody knows it, ask the system administrator to reset it rather than creating a duplicate username.

### Port 5000 or 5173 is already in use

Another copy of the system may still be running. Find its PowerShell window and stop it with **Ctrl+C**, then start the system again.

## Moving existing data from another computer

This installation guide creates a fresh setup. If the old computer has election records or uploaded images that must be kept, plan a backup and restore before using the new installation:

- If both computers will use the **same Atlas cluster**, point the new computer's `MONGO_URI_PRO` to that cluster and add the new computer's IP to Atlas. The existing database records remain in Atlas.
- If the old computer used **Local MongoDB**, its database is stored by the MongoDB service, not inside the `Election` project folder. Back up and restore the `Election-system` database with MongoDB Database Tools (`mongodump` and `mongorestore`) using the [official tools documentation](https://www.mongodb.com/docs/database-tools/). Also copy the `server/uploads` folder if candidate images should be preserved.
- Do not create a new admin before restoring an existing database that already contains the admin account. After restoring, sign in with the account already in that database.

Keep database backups and `.env` files private. They may contain sensitive election records or connection credentials.
