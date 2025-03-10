import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Switch, match } from 'react-router-dom'
import { Layout } from 'antd'
import firebase from 'firebase/app'
import 'firebase/functions'
import 'firebase/firestore'
import styled from 'styled-components'
import WebFont from 'webfontloader'

import { Nav } from './components/nav/Nav'
import { CustomSpin } from './components/Spin'
import { Head } from './components/Head'
import { ScrollToTop } from './components/ScrollToTop'

import { AnyAction } from 'redux'
import { ThunkDispatch } from 'redux-thunk'
import { Provider, connect } from 'react-redux'
import * as actionCreators from './redux/actions/index'
import { firebaseConfig } from './config'
import { store, IAppState } from './redux'

import { openNotificationWithIcon } from './components/Notification'

import { GlobalStyle } from './design'
import 'normalize.css'

import mitt from 'mitt'
import * as serviceWorker from './serviceWorker'

if (process.env.NODE_ENV === 'production') {
  console.log = () => {}
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
  firebase.app().functions('asia-east2')
}

const WebFontConfig: WebFont.Config = {
  google: {
    families: ['Fira Code', 'Montserrat:400,800', 'Roboto']
  }
}

WebFont.load(WebFontConfig)

function LazyComponent(Component: any) {
  return (props: any) => (
    <Suspense fallback={<CustomSpin />}>
      <Component {...props} />
    </Suspense>
  )
}

const Index = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "index.page" */ './pages/Index').then(
      module => ({ default: module.Index })
    )
  )
)

const NotFound = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "not-found.page" */ './pages/404').then(
      module => ({ default: module.NotFound })
    )
  )
)

const LearnPage = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "learn.page" */ './pages/Learn').then(
      module => ({ default: module.LearnPage })
    )
  )
)

const TasksPage = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "tasks.page" */ './pages/Tasks').then(
      module => ({ default: module.TasksPage })
    )
  )
)

const TaskDetailPage = LazyComponent(
  lazy(() =>
    import(
      /* webpackChunkName: "task-detail.page" */ './pages/TaskDetail'
    ).then(module => ({ default: module.TaskDetailPage }))
  )
)

const SubmissionsPage = LazyComponent(
  lazy(() =>
    import(
      /* webpackChunkName: "submissions.page" */ './pages/Submissions'
    ).then(module => ({ default: module.SubmissionsPage }))
  )
)

const SubmissionDetailPage = LazyComponent(
  lazy(() =>
    import(
      /* webpackChunkName: "submission-detail.page" */ './pages/SubmissionDetail'
    ).then(module => ({ default: module.SubmissionDetailPage }))
  )
)

const ProfilePage = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "profile.page" */ './pages/Profile').then(
      module => ({ default: module.Profile })
    )
  )
)

const SettingPage = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "setting.page" */ './pages/Setting').then(
      module => ({ default: module.SettingPage })
    )
  )
)

const Login = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "login.page" */ './pages/Login').then(
      module => ({ default: module.Login })
    )
  )
)

const Register = LazyComponent(
  lazy(() =>
    import(/* webpackChunkName: "register.page" */ './pages/Register').then(
      module => ({ default: module.Register })
    )
  )
)

const db = firebase.firestore()

const { Content, Footer } = Layout

const CustomLayout = styled(Layout)`
  min-height: 100vh;
  background-color: #fafafa;
`

interface IRootProps {
  onInitialLoad: () => void
  loadCurrentSubmissionData: (submission_id: string) => void
  resetCurrentSubmissionUID: () => void
  user: 'LOADING' | firebase.User | null
  currentSubmissionUID: string
  match: match
}

interface IRootStates {
  top: boolean
  checkNoti: boolean
  oldSubmissionID: string
}

const emitter: mitt.Emitter = new mitt()

class Root extends React.Component<IRootProps, IRootStates> {
  state: IRootStates = {
    top: true,
    checkNoti: false,
    oldSubmissionID: ''
  }

  componentDidMount() {
    this.props.onInitialLoad()
    window.addEventListener('online', this.handleNetworkEvent)
    window.addEventListener('offline', this.handleNetworkEvent)
    emitter.on('sw', this.handleServiceWorker)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleNetworkEvent)
    window.removeEventListener('offline', this.handleNetworkEvent)
    emitter.off('sw', this.handleServiceWorker)
  }

  handleNetworkEvent = () => {
    if (typeof navigator !== 'object') return

    navigator.onLine
      ? window.location.reload()
      : openNotificationWithIcon(
          'error',
          'You are offline',
          'Please connect to the internet before continuing'
        )
  }

  handleServiceWorker = () => {
    openNotificationWithIcon(
      'success',
      'Service Worker registered!',
      'Content is cached for offline use. ⚡⚡⚡'
    )
  }

  componentDidUpdate() {
    if (
      this.props.currentSubmissionUID !== undefined &&
      this.state.checkNoti === false
    ) {
      this.setState({
        checkNoti: true,
        oldSubmissionID: this.props.currentSubmissionUID
      })

      db.collection('submissions')
        .doc(this.props.currentSubmissionUID)
        .onSnapshot(doc => {
          const data = doc.data()
          if (data != null) {
            if (data.status !== 'in_queue') {
              openNotificationWithIcon(
                'success',
                'Submission Successful',
                'Done!'
              )

              this.props.resetCurrentSubmissionUID()
              this.props.loadCurrentSubmissionData(this.state.oldSubmissionID)
              this.setState({ checkNoti: false })
            }
          }
        })
    }
  }

  render() {
    return (
      <React.Fragment>
        <Head />
        {this.props.user === 'LOADING' ? (
          <CustomSpin />
        ) : (
          <Router>
            <ScrollToTop />
            <CustomLayout>
              <GlobalStyle />
              <Nav />
              <Content style={{ marginTop: 64 }}>
                <Switch>
                  <Route exact path="/" component={Index} />
                  <Route exact path="/tasks" component={TasksPage} />
                  <Route exact path="/tasks/:id" component={TaskDetailPage} />
                  <Route
                    exact
                    path="/submissions"
                    component={SubmissionsPage}
                  />
                  <Route
                    exact
                    path="/submissions/:id"
                    component={SubmissionDetailPage}
                  />
                  <Route exact path="/login" component={Login} />
                  <Route exact path="/register" component={Register} />
                  <Route exact path="/learn" component={LearnPage} />
                  <Route
                    exact
                    path="/learn/:article_id"
                    component={LearnPage}
                  />
                  <Route exact path="/profile" component={ProfilePage} />
                  <Route path="/setting/:sub" component={SettingPage} />
                  <Route component={NotFound} />
                </Switch>
              </Content>
              <Footer
                style={{ textAlign: 'center', backgroundColor: '#fafafa' }}
              >
                IPST ©2019 | Contribution: All the source code for this website
                is available on{' '}
                <a
                  href="https://github.com/programming-in-th/programming.in.th"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </Footer>
            </CustomLayout>
          </Router>
        )}
      </React.Fragment>
    )
  }
}

const mapStateToProps: (state: IAppState) => any = state => {
  return {
    user: state.user.user,
    currentSubmissionUID: state.submissions.currentSubmissionUID
  }
}

const mapDispatchToProps: (
  dispatch: ThunkDispatch<{}, {}, AnyAction>
) => any = dispatch => {
  return {
    onInitialLoad: () => {
      dispatch(actionCreators.fetchUser())
    },
    loadCurrentSubmissionData: (submission_id: string) => {
      dispatch(actionCreators.loadDetail(submission_id))
    },
    resetCurrentSubmissionUID: () => {
      dispatch(actionCreators.resetCurrentSubmission())
    }
  }
}

const RootPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(Root) as any

ReactDOM.render(
  <Provider store={store}>
    <RootPage />
  </Provider>,
  document.getElementById('react') as HTMLElement
)

serviceWorker.register({}, emitter)
