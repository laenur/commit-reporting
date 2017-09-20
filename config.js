module.exports = {
    site: {
        url: "http://stash.someserver", // bitbucket server url
        username: "ilham", // butbucket username
        password: "ilham", // bitbucket password
        title: "Cool Project - Daily Update - ", // reporting title, after 'Daily Update - ' it will insert date of the report
    },
    projects: [
        {
            name: "Cool", // bitbucket project title 
            reportTitle: "Cool Project", // just title for the 
            repos: [
                "Website_Revamp", // repo name 1
                "Invoice_System" // repo name 2
            ]
        }
    ]
}