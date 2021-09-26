const simpleGit = require('simple-git')
const dotenv = require('dotenv')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const env = fs.readFileSync('.env', 'utf-8')
const readlineSync = require('readline-sync')

Object.assign(process.env, dotenv.parse(env))


void async function main(){

  const repo_url = readlineSync.question("Enter github url: ")
  const repo_name = repo_url.trim().match(/\/([^\/]+)(\.git)*$/)[1]
  const repo_path = path.join('./repo', repo_name)
  if(fs.existsSync(repo_path)) 
    fs.rmSync(repo_path, { recursive: true });
  await simpleGit().clone('https://github.com/saniales/saniales.git', repo_path)
  console.log("Clone complete")
  global.git = simpleGit(repo_path)   
              .addConfig('user.name', process.env.name)
              .addConfig('user.email', process.env.email)
  const commits = (await git.log()).all
  const firstCommit = commits[0]
  console.log(commits[0])
  const command = `git filter-branch -f --env-filter "GIT_AUTHOR_NAME='${process.env.name}'; GIT_AUTHOR_EMAIL='${process.env.email}'; GIT_COMMITTER_NAME='${firstCommit.author_name}'; GIT_COMMITTER_EMAIL='${firstCommit.author_email}';" HEAD`
  cp.execSync(command, {
    cwd: repo_path
  })
  console.log((await git.log()).all[0])
  await createRepo(repo_name)
  await git.removeRemote('origin')
  await git.addRemote('origin', `https://${process.env.token}@github.com/mulhamadil/${repo_name}`)
  await git.branch(['-M', 'main'])
  await git.push('origin', 'main', ['-u'])
  console.log("\nFinished Uploading New Project!")
}()

async function createRepo(repo_name){
  const request = axios({
    method: 'post',
    url: 'https://api.github.com/user/repos',
    data: {
      name: repo_name
    },
    headers: {
      Authorization: `token ${process.env.token}`
    }
  })
  try{
    const response = await request
    console.log('repository created', response.data)
    return true
  }catch(e){
    console.error(e)
  }
  return false
}