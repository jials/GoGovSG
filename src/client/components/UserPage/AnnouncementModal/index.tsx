import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  Button,
  Dialog,
  IconButton,
  Typography,
  createStyles,
  makeStyles,
} from '@material-ui/core'

import { GoGovReduxState } from '../../../reducers/types'
import userActions from '../../../actions/user'
import useFullScreenDialog from '../helpers/fullScreenDialog'
import CloseIcon from '../../widgets/CloseIcon'

const useStyles = makeStyles((theme) =>
  createStyles({
    closeButton: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
    },
    headerText: {
      alignSelf: 'flex-end',
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    headerBanner: {
      paddingBottom: theme.spacing(8),
      backgroundColor: theme.palette.primary.dark,
    },
    announcementImage: {
      marginTop: theme.spacing(-4),
      marginBottom: theme.spacing(4),
    },
    announcementPadding: {
      paddingBottom: theme.spacing(4),
    },
    justifyCenter: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    },
    closeIconButton: {
      fill: (props) =>
        // @ts-ignore
        props.isFullScreenDialog ? '#BBBBBB' : theme.palette.primary.dark,
      // @ts-ignore
      height: (props) => (props.isFullScreenDialog ? 44 : 30.8),
      // @ts-ignore
      width: (props) => (props.isFullScreenDialog ? 44 : 30.8),
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
      // @ts-ignore
      marginLeft: (props) => (props.isFullScreenDialog ? 0 : theme.spacing(2)),
      // @ts-ignore
      marginRight: (props) => (props.isFullScreenDialog ? 0 : theme.spacing(2)),
    },
    headerWrapper: {
      background: '#f9f9f9',
      boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.1)',
      [theme.breakpoints.up('sm')]: {
        background: 'unset',
        boxShadow: 'unset',
      },
    },
    learnMoreButton: {
      // @ts-ignore
      filter: (props) => (props.isLightItems ? 'brightness(10)' : ''),
      // this class is not mobile first by default as padding should not be set
      // when it is not mobile.
      [theme.breakpoints.down('xs')]: {
        paddingLeft: 0,
        paddingRight: 0,
        minWidth: theme.spacing(6),
      },
      width: theme.spacing(16),
      marginTop: theme.spacing(3),
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.secondary.dark,
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
      },
    },
    modalBottom: {
      marginBottom: theme.spacing(8),
    },
  }),
)

export default function AnnouncementModal() {
  const dispatch = useDispatch()
  const isFullScreenDialog = useFullScreenDialog()
  const classes = useStyles({ isFullScreenDialog })
  const [showModal, setShowModal] = useState(false)

  const announcement = useSelector(
    (state: GoGovReduxState) => state.user.announcement,
  )

  useEffect(() => {
    const getUserAnnouncement = () =>
      dispatch(userActions.getUserAnnouncement())
    if (announcement === null) {
      getUserAnnouncement()
    } else {
      const announcementString = JSON.stringify(announcement)
      const previousAnnouncement = localStorage.getItem('announcement')
      if (previousAnnouncement !== announcementString) {
        localStorage.setItem('announcement', announcementString)
        const hasAnnouncement = Boolean(
          announcement.message ||
            announcement.title ||
            announcement.subtitle ||
            announcement.url ||
            announcement.image,
        )
        setShowModal(hasAnnouncement)
      }
    }
  }, [announcement, dispatch])

  return (
    <Dialog
      aria-labelledby="userModal"
      aria-describedby="user-modal"
      fullScreen={isFullScreenDialog}
      fullWidth={!isFullScreenDialog}
      maxWidth="md"
      open={showModal}
      onClose={() => setShowModal(false)}
    >
      {announcement?.image || announcement?.title ? (
        <div className={classes.headerBanner}>
          <div className={classes.closeButton}>
            <div />
            <IconButton
              className={classes.closeIconButton}
              onClick={() => setShowModal(false)}
              size="small"
            >
              <CloseIcon size={isFullScreenDialog ? 36 : 24} />
            </IconButton>
          </div>
          <div className={classes.justifyCenter}>
            {announcement?.title ? (
              <Typography
                className={classes.headerText}
                variant={isFullScreenDialog ? 'h6' : 'h3'}
                color="secondary"
              >
                {announcement.title}
              </Typography>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={classes.closeButton}>
          <div />
          <IconButton
            className={classes.closeIconButton}
            onClick={() => setShowModal(false)}
            size="small"
          >
            <CloseIcon size={isFullScreenDialog ? 36 : 24} />
          </IconButton>
        </div>
      )}
      {announcement?.image ? (
        <img
          className={`${classes.justifyCenter} ${classes.announcementImage}`}
          alt=""
          src={announcement.image}
        />
      ) : 
      (
        <div className={`${classes.justifyCenter} ${classes.announcementPadding}`} />
      )}
      {announcement?.subtitle ? (
        <Typography
          className={`${classes.headerText} ${classes.justifyCenter}`}
          variant="h6"
          color="primary"
        >
          {announcement.subtitle}
        </Typography>
      ) : null}
      {announcement?.message ? (
        <Typography className={classes.justifyCenter} variant="body2">
          {announcement.message}
        </Typography>
      ) : null}
      <div className={`${classes.justifyCenter} ${classes.modalBottom}`}>
        {announcement?.url ? (
          <Button
            href={announcement.url}
            target="_blank"
            color="primary"
            size="large"
            variant="text"
            className={classes.learnMoreButton}
          >
            Learn More
          </Button>
        ) : null}
      </div>
    </Dialog>
  )
}
