# Pharmacin API
Pharmacin API is the back-end of the application Pharmacin, user for all the business logic purposes and also where the database interpreted in. The API is mainly use for all the logic in the Android and IOS application and also for the landing page website.

## Tech Stack
1. AdonisJS v5
2. NodeJS version : 21.1.0
3. XAMPP version : 7.4.27

## Table of Content
1. Getting Started
   - Prerequisites
   - Installation
   - Run Program
2. Features
3. Licenses
4. Contact

## Getting Started
Pharmacin API is an API that develop using NodeJS with AdonisJS as the framework. AdonisJS is a NodeJS framework that's use Typescript as its languange. The API is also connected to a MySQL database using XAMPP. Before you can run the application, you need to install a couple of softwares so that the application can run perfectly.

### Prerequisites
- Node >= 16.14.0
- XAMPP (for Windows)
- MAMP (for MacOS)

### Installation
1. Clone the repository :
   
   ```bash
   git clone https://github.com/TioNovriadiPutra/pharmacin-api.git 
2. Navigate to pharmacin-api folder :

   ```bash
   cd pharmacin-api
3. Install the required dependencies:

   ```bash
   npm install
4. Create a `.env` file in the project root and copy paste the env from the file `.env.example` :
   
   ![Screenshot (171)](https://github.com/TioNovriadiPutra/pharmacin-api/assets/129643417/84ba9a65-9f33-426a-b4dc-a408de9b9fd9)
6. Change the MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB_NAME according to your database :

   ```env
   MYSQL_USER=<your mysql username>
   MYSQL_PASSWORD=<your mysql password>
   MYSQL_DB_NAME=<your database name for the app>
7. Create a new database directly in your MySQL with the name same as the `.env`

### Run Program
1. Open XAMPP or MAMP 
2. Run the MySQL server :
   - MAMP (for MacOS) :  
     
     <img width="648" alt="MAMP" src="https://github.com/TioNovriadiPutra/pharmacin-api/assets/129643417/cc83c2ff-ce24-4b0c-8f97-fd8419ed657a">

   - XAMPP (for Windows) :
     
     ![xampp-control-panel12](https://github.com/TioNovriadiPutra/pharmacin-api/assets/129643417/ea763612-f138-4316-acb0-ddc7dbd44fe7)

1. Navigate to pharmacin-api folder :

   ```bash
   cd pharmacin-api
2. Migrate the database :

   ```bash
   node ace migration:run
3. Run :

   ```bash
   node ace serve --watch

## License
This project license under the MIT License. See 
`LICENSE`
for more information.

## Contact
Tio Novriadi Putra - [tio_novriadi](https://instagram.com/tio_novriadi) - [tionvriadi@gmail.com](mailto:tionvriadi@gmail.com)  
Project link : [Pharmacin API](https://github.com/TioNovriadiPutra/pharmacin-api)
