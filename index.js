const stash = require("stash-client")
const config = require("./config")
const async = require("asyncawait/async")
const await = require("asyncawait/await")
const dateFormat = require("dateformat")

const fetchBranch = async (function (projectName, repo, page) {
    if (!page) {
        page = 0
    }
    const param = {
        start: 100*(page - 3)
    }
    let response
    response = await (stash(config.site).api().projects().repos(projectName).branches(repo).list(param)).body
    let branches = []
    response.values.forEach(branch => {
        if (branch.displayId === "master") return
        branches.push(branch.displayId)
        if (!response.isLastPage) {
            branches = branches.concat(await ( fetchBranch(projectName, repo, page + 1) ))
        }
    })
    return branches
})

const fetchCommit = async (function (projectName, repo, branch, todayDate, page) {
    if (!page) {
        page = 1
    }
    var tomorrowDate = new Date(Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1, 0, 0, 0))
    const param = {
        start: 100*(page - 1),
        from: branch,
        to: "master"
    }
    let responseBody = await ( stash(config.site).api().projects().repos(projectName).compare(repo).commits(param) ).body
    let commits = []
    responseBody.values.forEach(commit => {
        var commitDate = new Date(commit.committerTimestamp)
        if (commit.committer.slug === config.site.username) {
            if (commitDate > todayDate && commitDate <= tomorrowDate && commit.message.indexOf("Merge branch") !== 0 && commit.committer.slug === config.site.username) {
                commits.push({
                    message: "- " + commit.message[0].toUpperCase() + commit.message.substr(1),
                    commitUrl: config.site.url + "/projects/" + projectName + "/repos/" + repo + "/commits/" + commit.id,
                    committerTimestamp: commit.committerTimestamp
                })
            }
        }
    })
    if (!responseBody.isLastPage) {
        commits = commits.concat(await ( fetchCommit(projectName, repo, branch, todayDate, page + 1) ))
    }

    return commits
})

const printActivity = function(number, project, commits) {
    console.log(number + ". " + project.reportTitle)
    commits.forEach(commit => {
        console.log(commit.message)
        console.log(commit.commitUrl)
    })
}

const fetchActivity = async (function (project, repo, todayDate) {
    let branchs = await (fetchBranch (project.name, repo))
    let commits = []
    branchs.forEach (branch => {
        commits = commits.concat(await (fetchCommit (project.name, repo, branch, todayDate)))
    })
    commits.map(commit => {
        var duplicates = commits.filter(commitCheck => commitCheck.commitUrl === commit.commitUrl)
        while (duplicates.length > 1) {
            commits.pop(duplicates[0])
            duplicates = commits.filter(commitCheck => commitCheck.commitUrl === commit.commitUrl)
        }
    })
    commits.sort((a, b) => a.date > b.date )
    return commits
})

const main = async ( function() {
    let i = 1
    var todayDate// = new Date("2017-09-15T00:00:00")
    if (!todayDate) {
        var now = new Date()
        todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
    }
    console.log(config.site.title + dateFormat(todayDate, "dd mmmm yyyy"))
    config.projects.forEach(function(project) {
        let commits = []
        project.repos.forEach(function(repo) {
            commits = commits.concat(await ( fetchActivity(project, repo, todayDate) ))
        })
        commits.sort((a,b) => a.committerTimestamp > b.committerTimestamp)
        if (commits.length > 0) {
            printActivity(i, project, commits, todayDate)
            i++
        }
    })
})

main()