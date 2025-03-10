import React from 'react'
import { Table, Input, Switch, Icon, message } from 'antd'
import H from 'history'
import { connect } from 'react-redux'

import { ISubmissionPage, ISubmission } from '../redux/types/submission'
import * as actionCreators from '../redux/actions/index'
import {
  WhiteContainerWrapper,
  FilterWrapper,
  SubFilterWrapper
} from '../components/atomics'
import { ColumnProps } from 'antd/lib/table'
import { IAppState } from '../redux'
import { transformDate, ITimeObject } from '../utils/transform'

const Search = Input.Search

interface ISubmissionsComponentProps {
  onInitialLoad: () => void
  user: 'LOADING' | firebase.User | null
  history: H.History
  submissionsList: ISubmission[]
  submissionsPage: ISubmissionPage
  submissionsListStatus: 'LOADING' | 'SUCCESS' | null
  setPage: (page: ISubmissionPage) => void
}

interface ISubmissionsComponentState {
  submissionsList: ISubmission[]
  firstLoad: boolean
  submissionPage: ISubmissionPage | undefined
}

class SubmissionsComponent extends React.Component<
  ISubmissionsComponentProps,
  ISubmissionsComponentState
> {
  state = {
    submissionsList: [],
    firstLoad: false,
    submissionPage: undefined
  }

  componentDidMount() {
    this.props.onInitialLoad()
  }

  componentDidUpdate() {
    if (this.props.submissionsList.length > 1 && !this.state.firstLoad) {
      this.setState({
        submissionsList: this.props.submissionsList,
        firstLoad: true
      })
    }

    if (this.state.submissionPage !== this.props.submissionsPage) {
      this.setState({ submissionPage: this.props.submissionsPage })
      this.updateTask()
    }
  }

  updateTask = () => {
    const filteredEvents = this.props.submissionsList.filter(
      ({ problem_id, username, points }) => {
        const textLowerCase = this.props.submissionsPage.searchWord.toLowerCase()
        username = username.toLowerCase()
        const statusProblemID = problem_id.toLowerCase().includes(textLowerCase)
        const statusUser = username.toLowerCase().includes(textLowerCase)
        let pointFilter = true

        if (this.props.submissionsPage.pointFilter) {
          pointFilter = points === 100
        }

        return (statusProblemID || statusUser) && pointFilter
      }
    )

    this.setState({
      submissionsList: filteredEvents
    })
  }

  handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    this.props.setPage({
      ...this.props.submissionsPage,
      searchWord: e.currentTarget.value
    })
  }

  handlePointFilter = (check: boolean) => {
    this.props.setPage({
      ...this.props.submissionsPage,
      pointFilter: check
    })
  }

  CustomPagination = {
    showQuickJumper: true,
    showSizeChanger: true,
    defaultCurrent: this.props.submissionsPage.currentPage,
    defaultPageSize: this.props.submissionsPage.currentPageSize,
    onChange: (currentPage: number, currentPageSize: number | undefined) => {
      this.props.setPage({
        ...this.props.submissionsPage,
        currentPage,
        currentPageSize
      })
    },
    onShowSizeChange: (
      currentPage: number,
      currentPageSize: number | undefined
    ) => {
      this.props.setPage({
        ...this.props.submissionsPage,
        currentPage,
        currentPageSize
      })
    }
  }

  columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      render: (timestamp: ITimeObject) => <p>{transformDate(timestamp)}</p>
    },
    {
      title: 'User',
      dataIndex: 'username',
      defaultSortOrder: 'descend'
    },
    {
      title: 'Problem',
      dataIndex: 'problem_name',
      defaultSortOrder: 'descend'
    },
    {
      title: 'Language',
      dataIndex: 'language',
      defaultSortOrder: 'descend'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      defaultSortOrder: 'descend'
    },
    {
      title: 'Points',
      dataIndex: 'points'
    },
    {
      title: 'Time (s)',
      dataIndex: 'time'
    },
    {
      dataIndex: 'memory',
      title: 'Memory (KB)'
    }
  ]

  render() {
    return (
      <WhiteContainerWrapper>
        <FilterWrapper>
          <SubFilterWrapper>
            Search:
            <Search
              defaultValue={this.props.submissionsPage.searchWord}
              placeholder="Enter Problem ID or User"
              onChange={e => this.handleSearch(e)}
              style={{ width: 200, margin: 10 }}
            />
          </SubFilterWrapper>
          <SubFilterWrapper>
            <p>Points Filter: </p>
            <Switch
              style={{ marginLeft: 10 }}
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
              defaultChecked={this.props.submissionsPage.pointFilter}
              onChange={this.handlePointFilter}
            />
          </SubFilterWrapper>
        </FilterWrapper>
        <Table
          dataSource={this.state.submissionsList}
          columns={this.columns as ColumnProps<ISubmission>[]}
          loading={this.props.submissionsListStatus === 'LOADING'}
          pagination={this.CustomPagination}
          scroll={{ x: 100 }}
          rowKey={(record: ISubmission) => record.submission_id}
          onRow={(record: ISubmission) => {
            return {
              onClick: () => {
                let status = false
                if (this.props.user && this.props.user !== 'LOADING')
                  if (this.props.user.uid === record.uid) status = true
                if (!record.hideCode || status) {
                  this.props.history.push(
                    '/submissions/' + record.submission_id
                  )
                } else {
                  message.error('Access Denied')
                }
              }
            }
          }}
        />
      </WhiteContainerWrapper>
    )
  }
}

const mapStateToProps: (state: IAppState) => any = state => {
  return {
    user: state.user.user,
    submissionsList: state.submissions.submissionsList,
    submissionsPage: state.submissions.submissionsPage,
    submissionsListStatus: state.submissions.submissionsListStatus
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    onInitialLoad: () => {
      dispatch(actionCreators.loadSubmissionsList())
    },
    setPage: (setting: ISubmissionPage) => {
      dispatch(actionCreators.setSubPageConfig(setting))
    }
  }
}

export const SubmissionsPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(SubmissionsComponent)
